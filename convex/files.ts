import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a new file record
export const create = mutation({
    args: {
        userId: v.string(),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        mimeType: v.string(),
        storageId: v.string(),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const fileId = await ctx.db.insert("files", {
            userId: args.userId,
            fileName: args.fileName,
            fileType: args.fileType,
            fileSize: args.fileSize,
            mimeType: args.mimeType,
            storageId: args.storageId,
            uploadedAt: Date.now(),
            isProcessed: false,
            metadata: args.metadata,
        });

        return fileId;
    },
});

// Get files by user ID
export const getByUserId = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("files")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// Get a single file by ID
export const getById = query({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.fileId);
    },
});

// Generate a URL for uploading a file
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

// Update file processing status
export const updateProcessingStatus = mutation({
    args: {
        fileId: v.id("files"),
        isProcessed: v.boolean(),
        extractedText: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.fileId, {
            isProcessed: args.isProcessed,
            extractedText: args.extractedText,
            thumbnailUrl: args.thumbnailUrl,
        });
    },
});

// Delete a file
export const remove = mutation({
    args: { fileId: v.id("files") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.fileId);
    },
});

// Get files by storage ID
export const getByStorageId = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("files")
            .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
            .first();
    },
}); 