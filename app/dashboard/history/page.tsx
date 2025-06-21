"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Trash2, MessageSquare, CheckSquare, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function ChatHistoryPage() {
    const router = useRouter();
    const { user, isLoaded: isUserLoaded } = useUser();
    const searchParams = useSearchParams();
    const activeChatId = searchParams.get("chatId");
    const chats = useQuery(api.chat.getAllChats);
    const deleteChat = useMutation(api.chat.deleteChat);
    const [selectedChats, setSelectedChats] = useState<Set<Id<"chats">>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // Redirect to login if not authenticated
    if (isUserLoaded && !user) {
        router.push('/sign-in');
        return null;
    }

    // Show loading state while user data is being loaded
    if (!isUserLoaded) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const handleSelectAll = () => {
        if (!chats) return;
        if (selectAll) {
            setSelectedChats(new Set());
        } else {
            setSelectedChats(new Set(chats.map(chat => chat._id)));
        }
        setSelectAll(!selectAll);
    };

    const handleDeleteChat = async (chatId: Id<"chats">) => {
        if (window.confirm("Are you sure you want to delete this chat?")) {
            try {
                await deleteChat({ chatId });
                setSelectedChats((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(chatId);
                    return newSet;
                });
                toast.success("Chat deleted successfully");
            } catch (error) {
                console.error("Error deleting chat:", error);
                toast.error("Failed to delete chat");
            }
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedChats.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedChats.size} selected chats?`)) {
            try {
                const chatIds = Array.from(selectedChats);
                for (const chatId of chatIds) {
                    await deleteChat({ chatId });
                }
                setSelectedChats(new Set());
                toast.success(`${selectedChats.size} chats deleted successfully`);
            } catch (error) {
                console.error("Error deleting selected chats:", error);
                toast.error("Failed to delete some chats");
            }
        }
    };

    const handleChatClick = (chatId: Id<"chats">) => {
        router.push(`/dashboard/chat?chatId=${chatId}`);
    };

    const toggleChatSelection = (chatId: Id<"chats">) => {
        setSelectedChats((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(chatId)) {
                newSet.delete(chatId);
            } else {
                newSet.add(chatId);
            }
            return newSet;
        });
    };

    if (!chats) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    // Sort chats to show active chat first
    const sortedChats = [...chats].sort((a, b) => {
        if (a._id === activeChatId) return -1;
        if (b._id === activeChatId) return 1;
        return new Date(b.latestMessageTime).getTime() - new Date(a.latestMessageTime).getTime();
    });

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <header className="p-4 border-b border-gray-800 bg-gray-900 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSelectAll}
                            className="text-gray-400 hover:text-emerald-500 transition-colors"
                        >
                            {selectAll ? (
                                <CheckSquare className="w-5 h-5" />
                            ) : (
                                <Square className="w-5 h-5" />
                            )}
                        </button>
                        <h1 className="text-2xl font-bold text-white">Chat History</h1>
                    </div>
                    {selectedChats.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected ({selectedChats.size})
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                {sortedChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquare className="w-12 h-12 mb-4" />
                        <p>No chat history yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedChats.map((chat) => (
                            <div
                                key={chat._id}
                                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors duration-200 group ${chat._id === activeChatId
                                    ? "bg-emerald-500/10 border-emerald-500"
                                    : "bg-gray-800 border-gray-700 hover:border-emerald-500"
                                    }`}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleChatSelection(chat._id);
                                    }}
                                    className="text-gray-400 hover:text-emerald-500 transition-colors"
                                >
                                    {selectedChats.has(chat._id) ? (
                                        <CheckSquare className="w-5 h-5" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleChatClick(chat._id)}
                                >
                                    <p className="text-gray-200 truncate">{chat.latestMessage}</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {formatDistanceToNow(chat.latestMessageTime, { addSuffix: true })}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChat(chat._id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 