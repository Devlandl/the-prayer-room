import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Groups CRUD ---

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const email = identity.email || "";

    // Groups I created
    const created = await ctx.db
      .query("groups")
      .withIndex("by_createdByUserId", (q) => q.eq("createdByUserId", userId))
      .collect();

    // Groups I'm a member of
    const membershipsByEmail = await ctx.db
      .query("groupMembers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    const membershipsByUserId = await ctx.db
      .query("groupMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const memberGroupIds = new Set([
      ...membershipsByEmail.map((m) => m.groupId),
      ...membershipsByUserId.map((m) => m.groupId),
    ]);

    const memberGroups: typeof created = [];
    for (const groupId of memberGroupIds) {
      const group = await ctx.db.get(groupId);
      if (group && group.createdByUserId !== userId) {
        memberGroups.push(group);
      }
    }

    const allGroups = [...created, ...memberGroups];
    return allGroups.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    // Check if user is creator or member
    const userId = identity.subject;
    const email = identity.email || "";

    if (group.createdByUserId === userId) return group;

    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    const isMember = members.some(
      (m) => m.email === email || m.userId === userId
    );
    if (isMember) return group;

    return null;
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      createdByUserId: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const group = await ctx.db.get(args.groupId);
    if (!group || group.createdByUserId !== identity.subject) {
      throw new Error("Not found or not authorized");
    }
    // Delete all members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const m of members) {
      await ctx.db.delete(m._id);
    }
    // Delete all group requests and their prayers
    const requests = await ctx.db
      .query("groupRequests")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const r of requests) {
      const gps = await ctx.db
        .query("groupPrayers")
        .withIndex("by_groupRequestId", (q) => q.eq("groupRequestId", r._id))
        .collect();
      for (const gp of gps) {
        await ctx.db.delete(gp._id);
      }
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(args.groupId);
  },
});

// --- Group Members ---

export const listMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

export const inviteMember = mutation({
  args: {
    groupId: v.id("groups"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const group = await ctx.db.get(args.groupId);
    if (!group || group.createdByUserId !== identity.subject) {
      throw new Error("Not found or not authorized");
    }
    // Check if already invited
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    const alreadyInvited = existing.some(
      (m) => m.email.toLowerCase() === args.email.trim().toLowerCase()
    );
    if (alreadyInvited) throw new Error("Already invited");

    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: undefined,
      email: args.email.trim().toLowerCase(),
      joinedAt: Date.now(),
    });
  },
});

export const removeMember = mutation({
  args: { memberId: v.id("groupMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Not found");
    const group = await ctx.db.get(member.groupId);
    if (!group || group.createdByUserId !== identity.subject) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.memberId);
  },
});

// --- Group Requests (sharing prayers to a group) ---

export const listGroupRequests = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const requests = await ctx.db
      .query("groupRequests")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();

    // Enrich with prayer text and group prayer counts
    const enriched = [];
    for (const req of requests) {
      const prayer = await ctx.db.get(req.prayerId);
      if (!prayer) continue;

      const groupPrayers = await ctx.db
        .query("groupPrayers")
        .withIndex("by_groupRequestId", (q) => q.eq("groupRequestId", req._id))
        .collect();

      enriched.push({
        ...req,
        prayerText: prayer.text,
        prayerCategory: prayer.category,
        prayerPerson: prayer.person,
        prayerIsAnswered: prayer.isAnswered,
        groupPrayerCount: groupPrayers.length,
        prayedByMe: groupPrayers.some((gp) => gp.userId === identity.subject),
      });
    }

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const sharePrayerToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    prayerId: v.id("prayers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify prayer belongs to user
    const prayer = await ctx.db.get(args.prayerId);
    if (!prayer || prayer.userId !== identity.subject) {
      throw new Error("Prayer not found");
    }

    // Verify user is member or creator of group
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    const userId = identity.subject;
    const email = identity.email || "";

    if (group.createdByUserId !== userId) {
      const members = await ctx.db
        .query("groupMembers")
        .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
        .collect();
      const isMember = members.some(
        (m) => m.email === email || m.userId === userId
      );
      if (!isMember) throw new Error("Not a member of this group");
    }

    // Check if already shared
    const existing = await ctx.db
      .query("groupRequests")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    const alreadyShared = existing.some((r) => r.prayerId === args.prayerId);
    if (alreadyShared) throw new Error("Already shared to this group");

    await ctx.db.insert("groupRequests", {
      groupId: args.groupId,
      prayerId: args.prayerId,
      sharedByUserId: identity.subject,
      createdAt: Date.now(),
    });
  },
});

// --- Group Prayers ("I prayed for this") ---

export const prayForRequest = mutation({
  args: { groupRequestId: v.id("groupRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if already prayed
    const existing = await ctx.db
      .query("groupPrayers")
      .withIndex("by_groupRequestId", (q) =>
        q.eq("groupRequestId", args.groupRequestId)
      )
      .collect();
    const alreadyPrayed = existing.some(
      (gp) => gp.userId === identity.subject
    );
    if (alreadyPrayed) return; // silently ignore duplicate

    await ctx.db.insert("groupPrayers", {
      groupRequestId: args.groupRequestId,
      userId: identity.subject,
      prayedAt: Date.now(),
    });
  },
});

export const listGroupPrayers = query({
  args: { groupRequestId: v.id("groupRequests") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupPrayers")
      .withIndex("by_groupRequestId", (q) =>
        q.eq("groupRequestId", args.groupRequestId)
      )
      .collect();
  },
});
