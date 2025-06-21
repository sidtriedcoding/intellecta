import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const send = mutation({
  args: {
    content: v.string(),
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    attachments: v.optional(v.array(v.object({
      fileId: v.id("files"),
      fileName: v.string(),
      fileType: v.string(),
      fileSize: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      userId,
      chatId: args.chatId,
      role: args.role,
      createdAt: Date.now(),
      attachments: args.attachments,
    });

    return messageId;
  },
}); 