import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { StreamMessageType } from "@/lib/types";
import { cn } from "@/lib/utils";
import MessageBubble from "./MessageBubble";
import { createSSEParser } from "@/lib/createSSEParser";

interface Message {
    role: "user" | "assistant";
    content: string;
    type?: string;
    tool?: string;
    input?: string;
}

interface StreamMessage {
    type: string;
    message?: string;
    error?: string;
    token?: string;
    tool?: string;
    input?: string;
}

// Format tool output to string
const formatToolOutput = (output: unknown): string => {
    if (output === null || output === undefined) {
        return 'No output';
    }

    if (typeof output === 'string') {
        return output;
    }

    if (typeof output === 'object') {
        try {
            // Handle arrays and objects with pretty printing
            const formatted = JSON.stringify(output, null, 2);
            return formatted;
        } catch (e) {
            // If JSON.stringify fails, try to convert to string
            return String(output);
        }
    }

    // Handle numbers, booleans, and other primitives
    return String(output);
};

// Format terminal-style output
const formatTerminalOutput = (
    tool: string,
    input: unknown,
    output: unknown
): string => {
    const formattedOutput = formatToolOutput(output);
    const terminalHtml = `
<div class="terminal-container">
    <div class="terminal-header">
        <div class="terminal-buttons">
            <div class="terminal-button close"></div>
            <div class="terminal-button minimize"></div>
            <div class="terminal-button maximize"></div>
        </div>
        <div class="terminal-title">${tool}</div>
    </div>
    <div class="terminal-content">
        <div class="terminal-line">
            <span class="terminal-prompt">$</span>
            <span class="terminal-command">${formatToolOutput(input)}</span>
        </div>
        <div class="terminal-output">${formattedOutput}</div>
    </div>
</div>

<style>
.terminal-container {
    background-color: #1e1e1e;
    border-radius: 6px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    margin: 1rem 0;
    overflow: hidden;
}

.terminal-header {
    background-color: #2d2d2d;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #3d3d3d;
}

.terminal-buttons {
    display: flex;
    gap: 6px;
    margin-right: 12px;
}

.terminal-button {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.terminal-button.close {
    background-color: #ff5f56;
}

.terminal-button.minimize {
    background-color: #ffbd2e;
}

.terminal-button.maximize {
    background-color: #27c93f;
}

.terminal-title {
    color: #d4d4d4;
    font-size: 0.9rem;
    flex-grow: 1;
    text-align: center;
}

.terminal-content {
    padding: 12px;
    color: #d4d4d4;
    white-space: pre-wrap;
}

.terminal-line {
    margin-bottom: 8px;
}

.terminal-prompt {
    color: #ffbd2e;
    margin-right: 8px;
}

.terminal-command {
    color: #d4d4d4;
}

.terminal-output {
    color: #27c93f;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    white-space: pre;
}
</style>`;

    return terminalHtml;
};

// Parse SSE messages into chunks
const parseSSEChunks = (data: string): string[] => {
    return data
        .split('\n')
        .filter(line => line.startsWith('data: '))
        .map(line => line.slice(6));
};

// Handle streaming tokens and update response
const setStreamedResponse = (
    token: string,
    currentResponse: string,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): string => {
    const newResponse = currentResponse + token;
    setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === "assistant") {
            lastMessage.content = newResponse;
        } else {
            newMessages.push({
                role: "assistant",
                content: newResponse,
            });
        }
        return newMessages;
    });
    return newResponse;
};

// Handle tool execution start
const handleToolStart = (
    tool: string,
    input: string | null,
    setCurrentTool: (tool: string | null) => void,
    setCurrentToolInput: (input: string | null) => void,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
    setCurrentTool(tool);
    setCurrentToolInput(input);
    const toolMessage = formatTerminalOutput(
        tool,
        input || '',
        'Executing...'
    );
    setMessages(prev => [...prev, {
        role: "assistant",
        content: toolMessage,
        type: "tool_start"
    }]);
};

// Handle tool execution completion
const handleToolEnd = (
    setCurrentTool: (tool: string | null) => void,
    setCurrentToolInput: (input: string | null) => void,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
    setCurrentTool(null);
    setCurrentToolInput(null);

    setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.type === "tool_start") {
            lastMessage.type = "tool_complete";
        }
        return newMessages;
    });
};

// Handle error messages
const handleStreamError = (
    error: string,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsLoading: (loading: boolean) => void
) => {
    console.error("Stream error:", error);
    setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${error}`,
        type: "error"
    }]);
    setIsLoading(false);
};

// Handle stream completion
const handleStreamComplete = async (
    fullResponse: string,
    chatId: string,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsLoading: (loading: boolean) => void
) => {
    // Save the complete message to the database
    try {
        await fetch('/api/chat/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId,
                content: fullResponse,
                role: 'assistant'
            }),
        });
    } catch (error) {
        console.error('Error saving message:', error);
    }

    setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage?.role === "assistant") {
            lastMessage.content = fullResponse;
        }
        return newMessages;
    });
    setIsLoading(false);
};

// Process stream chunks with all handlers
const processStreamChunk = (
    chunk: string,
    currentResponse: string,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setCurrentTool: (tool: string | null) => void,
    setCurrentToolInput: (input: string | null) => void,
    setIsLoading: (loading: boolean) => void,
    chatId: string
): string => {
    const lines = parseSSEChunks(chunk);
    let response = currentResponse;

    for (const line of lines) {
        try {
            const data = JSON.parse(line) as StreamMessage;

            switch (data.type) {
                case StreamMessageType.TOKEN:
                    if (data.token) {
                        response = setStreamedResponse(data.token, response, setMessages);
                    }
                    break;

                case StreamMessageType.TOOL_START:
                    if (data.tool) {
                        handleToolStart(data.tool, data.input || null, setCurrentTool, setCurrentToolInput, setMessages);
                    }
                    break;

                case StreamMessageType.TOOL_END:
                    handleToolEnd(setCurrentTool, setCurrentToolInput, setMessages);
                    break;

                case StreamMessageType.ERROR:
                    if (data.error) {
                        handleStreamError(data.error, setMessages, setIsLoading);
                    }
                    break;

                case StreamMessageType.DONE:
                    handleStreamComplete(response, chatId, setMessages, setIsLoading);
                    break;
            }
        } catch (e) {
            console.error("Error processing stream chunk:", e);
        }
    }

    return response;
};

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentTool, setCurrentTool] = useState<string | null>(null);
    const [currentToolInput, setCurrentToolInput] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const { sendMessage, chatId } = useChat();
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