import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return sessions.sort((a, b) => b.completedAt - a.completedAt);
  },
});

export const create = mutation({
  args: {
    duration: v.number(),
    topic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("sessions", {
      userId: identity.subject,
      duration: args.duration,
      topic: args.topic,
      completedAt: Date.now(),
    });
  },
});
