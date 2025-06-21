import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new Response("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { chatId, content, role } = body;

        if (!chatId || !content || !role) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const convex = getConvexClient();
        
        // Save the message to Convex
        await convex.mutation(api.chat.sendMessage, {
            chatId,
            content,
            role
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error saving message:", error);
        return NextResponse.json(
            { error: "Failed to save message" },
            { status: 500 }
        );
    }
}
