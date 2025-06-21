import { StreamMessageType } from "@/lib/types";
import { StreamRequest } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import {
    SSE_DATA_PREFIX,
    SSE_LINE_DELIMITER,
} from "@/lib/types";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { submitQuestion } from "@/lib/langgraph";

interface StreamMessage {
    type: string;
    message?: string;
    error?: string;
    token?: string;
    tool?: string;
    input?: string;
}

interface FileAttachment {
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

function sendSSEMessage(
    writer: WritableStreamDefaultWriter<Uint8Array>,
    data: StreamMessage
) {
    const encoder = new TextEncoder();
    return writer.write(
        encoder.encode(
            `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
        )
    );
}

export async function POST(req: Request) {
    try {
        const { userId, getToken } = await auth();
        if (!userId) {
            console.error("Unauthorized: No user ID found");
            return new Response("Unauthorized", { status: 401 });
        }

        // Get the JWT token from Clerk
        const token = await getToken({ template: "convex" });
        if (!token) {
            console.error("Failed to get authentication token");
            return new Response("Failed to get authentication token", { status: 401 });
        }

        const body = (await req.json()) as StreamRequest & { attachments?: FileAttachment[] };
        const { chatId, content, attachments } = body;

        console.log("Received request:", { chatId, content, attachments });

        if (!chatId || (!content && (!attachments || attachments.length === 0))) {
            console.error("Missing required fields:", { chatId, content, attachments });
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const convex = getConvexClient(token);

        // Create a stream with larger queue strategy to handle the request
        const stream = new TransformStream({}, { highWaterMark: 1024 });
        const writer = stream.writable.getWriter();

        // Start the streaming response
        const response = new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });

        const startStream = async () => {
            try {
                // Send initial connection established message
                await sendSSEMessage(writer, { type: StreamMessageType.CONNECTED });
                console.log("Connection established");

                // Process file attachments if any
                let fileContent = "";
                if (attachments && attachments.length > 0) {
                    console.log("Processing file attachments...");

                    for (const attachment of attachments) {
                        try {
                            // Get file details from Convex
                            const fileRecord = await convex.query(api.files.getById, {
                                fileId: attachment.fileId as any
                            });

                            if (fileRecord) {
                                fileContent += `\n\nFile: ${attachment.fileName}\n`;
                                fileContent += `Type: ${attachment.fileType}\n`;
                                fileContent += `Size: ${attachment.fileSize} bytes\n`;

                                // If file has extracted text, include it
                                if (fileRecord.extractedText) {
                                    fileContent += `Content:\n${fileRecord.extractedText}\n`;
                                } else {
                                    fileContent += `Content: [File content not yet processed]\n`;
                                }
                            }
                        } catch (error) {
                            console.error(`Error processing file ${attachment.fileName}:`, error);
                            fileContent += `\n\nFile: ${attachment.fileName} (Error processing file)\n`;
                        }
                    }
                }

                // Combine user message with file content
                const fullContent = content ? `${content}${fileContent}` : fileContent;

                // Send user message to Convex
                console.log("Sending message to Convex...");
                await convex.mutation(api.chat.sendMessage, {
                    chatId,
                    content: fullContent,
                    role: "user",
                    attachments: attachments ? attachments.map(att => ({
                        fileId: att.fileId as any,
                        fileName: att.fileName,
                        fileType: att.fileType,
                        fileSize: att.fileSize,
                    })) : undefined,
                });
                console.log("Message sent to Convex");

                // Get messages from Convex
                console.log("Fetching messages from Convex...");
                const messages = await convex.query(api.chat.getMessages, { chatId });

                if (!messages) {
                    console.error("Failed to retrieve messages from Convex");
                    throw new Error("Failed to retrieve messages from Convex");
                }
                console.log("Messages retrieved from Convex");

                // Convert messages to LangChain format
                const langChainMessages = [
                    ...messages.map((msg: { role: string; content: string }) =>
                        msg.role === "user"
                            ? new HumanMessage(msg.content)
                            : new AIMessage(msg.content)
                    ),
                    new HumanMessage(fullContent) // Add the current message with file content
                ];

                try {
                    // Create the event stream
                    console.log("Creating event stream...");
                    const eventStream = await submitQuestion(langChainMessages, chatId);

                    let completeResponse = "";
                    let lastSentContent = "";

                    // Process all the events
                    for await (const event of eventStream) {
                        console.log("Processing event:", event.event);

                        if (event.event === "on_chat_model_stream") {
                            const token = event.data.chunk;
                            if (token) {
                                const text = token.content;
                                if (text) {
                                    // Accumulate the complete response
                                    completeResponse += text;

                                    // Only send the new content (delta) to avoid sending the entire response each time
                                    const newContent = completeResponse.substring(lastSentContent.length);
                                    if (newContent) {
                                        await sendSSEMessage(writer, {
                                            type: StreamMessageType.TOKEN,
                                            token: newContent,
                                        });
                                        lastSentContent = completeResponse;
                                    }
                                }
                            }
                        } else if (event.event === "on_tool_start") {
                            await sendSSEMessage(writer, {
                                type: StreamMessageType.TOOL_START,
                                tool: event.name || "unknown",
                                input: event.data.input,
                            });
                        } else if (event.event === "on_tool_end") {
                            await sendSSEMessage(writer, {
                                type: StreamMessageType.TOOL_END,
                                tool: event.name || "unknown",
                                input: event.data.output,
                            });
                        }
                    }

                    // Save the complete assistant's message to Convex
                    if (completeResponse.trim()) {
                        await convex.mutation(api.chat.sendMessage, {
                            chatId,
                            content: completeResponse,
                            role: "assistant"
                        });
                    }

                    // Send DONE message
                    await sendSSEMessage(writer, { type: StreamMessageType.DONE });
                } catch (streamError) {
                    console.error("Error in event stream:", streamError);
                    await sendSSEMessage(writer, {
                        type: StreamMessageType.ERROR,
                        error: streamError instanceof Error
                            ? streamError.message
                            : "Stream processing failed",
                    });
                }
            } catch (error) {
                console.error("Error in stream:", error);
                await sendSSEMessage(writer, {
                    type: StreamMessageType.ERROR,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            } finally {
                try {
                    await writer.close();
                } catch (closeError) {
                    console.error("Error closing writer:", closeError);
                }
            }
        };

        startStream();
        return response;

    } catch (error) {
        console.error("Error streaming API response:", error);
        return NextResponse.json(
            { error: "Failed to process chat request" },
            { status: 500 }
        );
    }
}
