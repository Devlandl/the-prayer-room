import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
