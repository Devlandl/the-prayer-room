import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prayers: defineTable({
    userId: v.string(),
    text: v.string(),
    category: v.string(),
    person: v.optional(v.string()),
    isAnswered: v.boolean(),
    answeredAt: v.optional(v.number()),
    shareId: v.optional(v.string()),
    prayedForCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_shareId", ["shareId"]),

  people: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  sessions: defineTable({
    userId: v.string(),
    duration: v.number(),
    topic: v.optional(v.string()),
    completedAt: v.number(),
  }).index("by_userId", ["userId"]),

  groups: defineTable({
    name: v.string(),
    createdByUserId: v.string(),
    createdAt: v.number(),
  }).index("by_createdByUserId", ["createdByUserId"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.optional(v.string()),
    email: v.string(),
    joinedAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),

  groupRequests: defineTable({
    groupId: v.id("groups"),
    prayerId: v.id("prayers"),
    sharedByUserId: v.string(),
    createdAt: v.number(),
  }).index("by_groupId", ["groupId"]),

  groupPrayers: defineTable({
    groupRequestId: v.id("groupRequests"),
    userId: v.string(),
    prayedAt: v.number(),
  }).index("by_groupRequestId", ["groupRequestId"]),
});
