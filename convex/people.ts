import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const people = await ctx.db
      .query("people")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return people.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const createIfNotExists = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const userId = identity.subject;
    const existing = await ctx.db
      .query("people")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const alreadyExists = existing.some(
      (p) => p.name.toLowerCase() === args.name.trim().toLowerCase()
    );
    if (alreadyExists) return;
    await ctx.db.insert("people", {
      userId,
      name: args.name.trim(),
      createdAt: Date.now(),
    });
  },
});
