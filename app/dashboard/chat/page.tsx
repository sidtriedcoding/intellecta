"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ChatClient from "./ChatClient";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const createChat = useMutation(api.chat.create.create);
    const chatId = searchParams.get("chatId");

    useEffect(() => {
        const initializeChat = async () => {
            if (!chatId) {
                try {
                    const newChatId = await createChat({ title: "New Chat" });
                    router.push(`/dashboard/chat?chatId=${newChatId}`);
                } catch (error) {
                    console.error("Error creating new chat:", error);
                }
            }
        };

        initializeChat();
    }, [chatId, createChat, router]);

    if (!chatId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return <ChatClient />;
}
