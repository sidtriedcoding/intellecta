import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { StreamMessageType } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import { createSSEParser } from "@/lib/createSSEParser";

interface Message {
    role: "user" | "assistant";
    content: string;
    type?: string;
    tool?: string;
    input?: string;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentTool, setCurrentTool] = useState<string | null>(null);
    const [currentToolInput, setCurrentToolInput] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const { chatId } = useChat();
    const sseParser = createSSEParser();

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        console.log("Starting chat submission...");
        console.log("Chat ID:", chatId);
        console.log("User:", user.id);
        console.log("Input message:", input);

        const userMessage: Message = {
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            console.log("Sending request to /api/chat/stream...");
            const response = await fetch("/api/chat/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chatId,
                    content: input,
                }),
            });

            console.log("Response status:", response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Stream error response:", errorText);
                throw new Error(`Failed to send message: ${response.status} ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                console.error("No reader available");
                throw new Error("No reader available");
            }

            let assistantMessage = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log("Stream complete");
                    break;
                }

                const chunk = decoder.decode(value);
                console.log("Received chunk:", chunk);
                const parsedMessages = sseParser.parse(chunk);

                for (const message of parsedMessages) {
                    console.log("Processing message:", message);
                    switch (message.type) {
                        case StreamMessageType.TOKEN:
                            if (message.token) {
                                assistantMessage += message.token;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage?.role === "assistant") {
                                        lastMessage.content = assistantMessage;
                                    } else {
                                        newMessages.push({
                                            role: "assistant",
                                            content: assistantMessage,
                                        });
                                    }
                                    return newMessages;
                                });
                            }
                            break;

                        case StreamMessageType.TOOL_START:
                            if (message.tool) {
                                console.log("Tool start:", message.tool);
                                setCurrentTool(message.tool);
                                setCurrentToolInput(message.input as string || null);
                            }
                            break;

                        case StreamMessageType.TOOL_END:
                            console.log("Tool end");
                            setCurrentTool(null);
                            setCurrentToolInput(null);
                            break;

                        case StreamMessageType.ERROR:
                            if (message.error) {
                                console.error("Stream error:", message.error);
                                setMessages(prev => [...prev, {
                                    role: "assistant",
                                    content: `Error: ${message.error}`,
                                    type: "error"
                                }]);
                            }
                            break;

                        case StreamMessageType.DONE:
                            console.log("Stream done");
                            setIsLoading(false);
                            break;
                    }
                }
            }
        } catch (error) {
            console.error("Error in chat stream:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I encountered an error while processing your message. Please try again.",
                type: "error"
            }]);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <MessageBubble
                            key={index}
                            content={message.content}
                            isUser={message.role === "user"}
                        />
                    ))}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>AI is thinking...</span>
                        </div>
                    )}
                    {currentTool && (
                        <Card className="p-4 max-w-[80%] mr-auto bg-muted">
                            <div className="text-sm text-muted-foreground">
                                Using tool: {currentTool}
                                {currentToolInput && (
                                    <div className="mt-2">
                                        Input: {currentToolInput}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="min-w-[40px]"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
} 