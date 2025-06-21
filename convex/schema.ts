import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    chats: defineTable({
        userId: v.string(),
        createdAt: v.number(),
        latestMessage: v.optional(v.string()),
        latestMessageTime: v.optional(v.number()),
    }).index("by_userId", ["userId"]),

    messages: defineTable({
        chatId: v.id("chats"),
        userId: v.string(),
        content: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        createdAt: v.number(),
        isComplete: v.optional(v.boolean()),
        attachments: v.optional(v.array(v.object({
            fileId: v.id("files"),
            fileName: v.string(),
            fileType: v.string(),
            fileSize: v.number(),
        }))),
    }).index("by_chat", ["chatId"]),

    files: defineTable({
        userId: v.string(),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        storageId: v.string(), // Reference to storage system
        uploadedAt: v.number(),
        isProcessed: v.boolean(),
        extractedText: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        metadata: v.optional(v.any()),
    }).index("by_userId", ["userId"]).index("by_storageId", ["storageId"]),
});