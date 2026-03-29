import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("all"), v.literal("active"), v.literal("answered"))),
    category: v.optional(v.string()),
    person: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    let prayers = await ctx.db
      .query("prayers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by status
    if (args.status === "active") {
      prayers = prayers.filter((p) => !p.isAnswered);
    } else if (args.status === "answered") {
      prayers = prayers.filter((p) => p.isAnswered);
    }

    // Filter by category
    if (args.category) {
      prayers = prayers.filter((p) => p.category === args.category);
    }

    // Filter by person
    if (args.person) {
      prayers = prayers.filter((p) => p.person === args.person);
    }

    return prayers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { prayerId: v.id("prayers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const prayer = await ctx.db.get(args.prayerId);
    if (!prayer || prayer.userId !== identity.subject) return null;
    return prayer;
  },
});

export const getByShareId = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const prayer = await ctx.db
      .query("prayers")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .first();
    if (!prayer) return null;
    // Return only public-safe fields
    return {
      _id: prayer._id,
      text: prayer.text,
      category: prayer.category,
      person: prayer.person,
      prayedForCount: prayer.prayedForCount,
      createdAt: prayer.createdAt,
    };
  },
});

export const create = mutation({
  args: {
    text: v.string(),
    category: v.string(),
    person: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // If person is provided, auto-create in people table
    if (args.person && args.person.trim()) {
      const userId = identity.subject;
      const existing = await ctx.db
        .query("people")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      const alreadyExists = existing.some(
        (p) => p.name.toLowerCase() === args.person!.trim().toLowerCase()
      );
      if (!alreadyExists) {
        await ctx.db.insert("people", {
          userId,
          name: args.person.trim(),
          createdAt: Date.now(),
        });
      }
    }

    return await ctx.db.insert("prayers", {
      userId: identity.subject,
      text: args.text,
      category: args.category,
      person: args.person?.trim() || undefined,
      isAnswered: false,
      answeredAt: undefined,
      shareId: undefined,
      prayedForCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const markAnswered = mutation({
  args: { prayerId: v.id("prayers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const prayer = await ctx.db.get(args.prayerId);
    if (!prayer || prayer.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(args.prayerId, {
      isAnswered: true,
      answeredAt: Date.now(),
    });
  },
});

export const unmarkAnswered = mutation({
  args: { prayerId: v.id("prayers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const prayer = await ctx.db.get(args.prayerId);
    if (!prayer || prayer.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(args.prayerId, {
      isAnswered: false,
      answeredAt: undefined,
    });
  },
});

export const generateShareId = mutation({
  args: { prayerId: v.id("prayers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const prayer = await ctx.db.get(args.prayerId);
    if (!prayer || prayer.userId !== identity.subject) throw new Error("Not found");
    if (prayer.shareId) return prayer.shareId;
    const shareId =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);
    await ctx.db.patch(args.prayerId, { shareId });
    return shareId;
  },
});

export const incrementPrayedFor = mutation({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const prayer = await ctx.db
      .query("prayers")
      .withIndex("by_shareId", (q) => q.eq("shareId", args.shareId))
      .first();
    if (!prayer) throw new Error("Not found");
    await ctx.db.patch(prayer._id, {
      prayedForCount: prayer.prayedForCount + 1,
    });
  },
});

export const remove = mutation({
  args: { prayerId: v.id("prayers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const prayer = await ctx.db.get(args.prayerId);
    if (!prayer || prayer.userId !== identity.subject) throw new Error("Not found");
    // Delete associated group requests
    const groupRequests = await ctx.db
      .query("groupRequests")
      .collect();
    const relatedRequests = groupRequests.filter((gr) => gr.prayerId === args.prayerId);
    for (const gr of relatedRequests) {
      // Delete group prayers for this request
      const groupPrayers = await ctx.db
        .query("groupPrayers")
        .withIndex("by_groupRequestId", (q) => q.eq("groupRequestId", gr._id))
        .collect();
      for (const gp of groupPrayers) {
        await ctx.db.delete(gp._id);
      }
      await ctx.db.delete(gr._id);
    }
    await ctx.db.delete(args.prayerId);
  },
});
