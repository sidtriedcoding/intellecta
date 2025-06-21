import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { auth } from "@clerk/nextjs";
import { Auth } from "convex/server";

// Helper function to get user ID
const getUser = async (ctx: { auth: Auth }) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
};

export const createNewChat = mutation({
  handler: async (ctx) => {
    const userId = await getUser(ctx);

    // Create a new chat
    const chatId = await ctx.db.insert("chats", {
      userId,
      createdAt: Date.now(),
      latestMessage: "New chat",
      latestMessageTime: Date.now(),
    });

    // Insert a welcome message from the AI
    await ctx.db.insert("messages", {
      chatId,
      userId,
      content: "Hello! I'm Intellecta, your AI assistant. How can I help you today?",
      role: "assistant",
      createdAt: Date.now(),
    });

    return { success: true, chatId };
  },
});

export const sendMessage = mutation({
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
    const userId = await getUser(ctx);

    // Insert the user's message
    const userMessageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      userId,
      content: args.content,
      role: args.role,
      createdAt: Date.now(),
      attachments: args.attachments,
    });

    // Create a placeholder for the AI response if the user sent the message
    let aiMessageId;
    if (args.role === 'user') {
      aiMessageId = await ctx.db.insert("messages", {
        chatId: args.chatId,
        userId,
        content: "",
        role: "assistant",
        createdAt: Date.now(),
        isComplete: false,
      });
    }

    // Update the chat's latest message
    await ctx.db.patch(args.chatId, {
      latestMessage: args.content,
      latestMessageTime: Date.now(),
    });

    return {
      success: true,
      userMessageId,
      aiMessageId
    };
  },
});

//Tracking full response for saving the database
let fullResponse = "";

export const getMessages = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getUser(ctx);

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .order("asc")
      .collect();

    return messages;
  },
});

export const deleteMessages = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getUser(ctx);

    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { success: true };
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const userId = await getUser(ctx);

    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or unauthorized");
    }

    // Delete all messages in the chat first
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.chatId);

    return { success: true };
  },
});

export const getAllChats = query({
  handler: async (ctx) => {
    const userId = await getUser(ctx);

    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    // Get the latest message for each chat
    const chatsWithLatestMessage = await Promise.all(
      chats.map(async (chat) => {
        const latestMessage = await ctx.db
          .query("messages")
          .filter((q) => q.eq(q.field("chatId"), chat._id))
          .order("desc")
          .first();

        return {
          ...chat,
          latestMessage: latestMessage?.content || "No messages yet",
          latestMessageTime: latestMessage?.createdAt || chat.createdAt,
        };
      })
    );

    return chatsWithLatestMessage;
  },
});

export const startStreamingResponse = action({
  args: {
    chatId: v.id("chats"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Here you would typically connect to your AI service
    // and start streaming the response
    // For now, we'll just return a success status
    return { success: true };
  },
});

export const saveCompleteResponse = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Update the message with the complete content
    await ctx.db.patch(args.messageId, {
      content: args.content,
      isComplete: true,
    });

    return { success: true };
  },
}); 