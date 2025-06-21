import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

export function useChat() {
    const searchParams = useSearchParams();
    const chatId = searchParams.get("chatId") as Id<"chats">;

    const messages = useQuery(api.chat.getMessages, chatId ? { chatId } : "skip");
    const sendMessage = useMutation(api.chat.sendMessage);

    return {
        chatId,
        messages,
        sendMessage,
    };
} 