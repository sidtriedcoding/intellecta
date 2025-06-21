"use client";

import React, { useState, useEffect, useRef } from "react";
import { createSSEParser } from "@/lib/createSSEParser";
import { StreamMessageType } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Paperclip } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import FileUpload from "@/components/FileUpload";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import FileAttachmentComponent from "@/components/FileAttachment";

interface FileAttachment {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
}

interface Message {
  role: string;
  content: string;
  attachments?: FileAttachment[];
}

const ChatClient: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { chatId, messages: existingMessages } = useChat();
  const sseParser = createSSEParser();
  const assistantMessageIndexRef = useRef<number>(-1);
  const currentResponseRef = useRef<string>("");

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createFile = useMutation(api.files.create);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages when component mounts or chatId changes
  useEffect(() => {
    if (existingMessages && chatId) {
      setMessages(existingMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments || []
      })));
    }
  }, [existingMessages, chatId]);

  // Reset state when chatId changes
  useEffect(() => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    setSelectedFiles([]);
    currentResponseRef.current = "";
  }, [chatId]);

  const handleFileUpload = async (files: File[]) => {
    if (!user) return;

    try {
      const uploadPromises = files.map(async (file) => {
        const uploadUrl = await generateUploadUrl();

        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          const errorText = await result.text();
          throw new Error(`Upload failed for ${file.name}: ${errorText}`);
        }

        const { storageId } = await result.json();

        const fileId = await createFile({
          userId: user.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          mimeType: file.type,
          storageId,
        });

        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

        return {
          fileId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          previewUrl,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      setSelectedFiles(prev => [...prev, ...uploadedFiles]);
      setShowFileUpload(false);

    } catch (error) {
      console.error('File upload error:', error);
      alert(`Failed to upload files. ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => file.fileId !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || !user || !chatId) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input; // Store the input before clearing
    const currentFiles = selectedFiles; // Store the files before clearing
    setInput("");
    setSelectedFiles([]);
    setIsLoading(true);
    currentResponseRef.current = ""; // Reset current response

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const attemptRequest = async () => {
      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId,
            content: currentInput, // Use stored input
            attachments: currentFiles, // Include file attachments
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error?.type === "overloaded_error" && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying request (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
            return attemptRequest();
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to get reader from response body.");
        }

        // Add empty assistant message placeholder
        setMessages(prev => {
          const newMessages = [...prev, { role: "assistant", content: "" }];
          assistantMessageIndexRef.current = newMessages.length - 1;
          return newMessages;
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          console.log("Stream chunk:", chunk);
          const parsedMessages = sseParser.parse(chunk);

          for (const message of parsedMessages) {
            switch (message.type) {
              case StreamMessageType.TOKEN:
                if ('token' in message) {
                  // Accumulate the response
                  currentResponseRef.current += message.token;

                  // Update the assistant message with the accumulated response
                  setMessages(prev => {
                    const newMessages = [...prev];
                    if (assistantMessageIndexRef.current >= 0 && assistantMessageIndexRef.current < newMessages.length) {
                      newMessages[assistantMessageIndexRef.current].content = currentResponseRef.current;
                    }
                    return newMessages;
                  });
                }
                break;

              case StreamMessageType.ERROR:
                if ('error' in message) {
                  console.error("Stream error:", message.error);

                  if (message.error.includes("overloaded") && retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying request (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
                    return attemptRequest();
                  }

                  // Update the assistant message with error
                  setMessages(prev => {
                    const newMessages = [...prev];
                    if (assistantMessageIndexRef.current >= 0 && assistantMessageIndexRef.current < newMessages.length) {
                      newMessages[assistantMessageIndexRef.current].content = `Error: ${message.error}`;
                    } else {
                      newMessages.push({
                        role: "assistant",
                        content: `Error: ${message.error}`,
                      });
                    }
                    return newMessages;
                  });
                }
                break;

              case StreamMessageType.DONE:
                setIsLoading(false);
                break;
            }
          }
        }
      } catch (error) {
        console.error("Error in chat stream:", error);

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying request (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          return attemptRequest();
        }

        // Handle error case
        setMessages(prev => {
          const newMessages = [...prev];
          if (assistantMessageIndexRef.current >= 0 && assistantMessageIndexRef.current < newMessages.length) {
            newMessages[assistantMessageIndexRef.current].content = "Sorry, I encountered an error while processing your message. Please try again in a moment.";
          } else {
            newMessages.push({
              role: "assistant",
              content: "Sorry, I encountered an error while processing your message. Please try again in a moment.",
            });
          }
          return newMessages;
        });
        setIsLoading(false);
      }
    };

    await attemptRequest();
  };

  if (!chatId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-400">
        <p className="text-lg mb-2">No chat selected</p>
        <p className="text-sm">Please select a chat or start a new one</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-400">
              <p className="text-lg mb-2">Start a new conversation</p>
              <p className="text-sm">Type a message below to begin chatting</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={`${message.role}-${index}`}
                content={message.content}
                isUser={message.role === "user"}
                attachments={message.attachments}
              />
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="border-t p-4" style={{ backgroundColor: 'var(--background)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Attached Files:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFiles([])}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedFiles.map((file) => (
              <FileAttachmentComponent
                key={file.fileId}
                fileName={file.fileName}
                fileType={file.fileType}
                fileSize={file.fileSize}
                thumbnailUrl={file.previewUrl}
                onRemove={() => removeFile(file.fileId)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="border-t p-4" style={{ backgroundColor: 'var(--background)' }}>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <FileUpload onFilesSelected={handleFileUpload}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-blue-600"
              disabled={isLoading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </FileUpload>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-white/10 text-white placeholder-white/60 border-white/20 focus:ring-white/30"
          />
          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
            className="min-w-[40px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* File Upload Component */}
        {showFileUpload && (
          <div className="mt-4">
            <FileUpload
              onFilesSelected={handleFileUpload}
              maxFiles={10}
              maxSize={50 * 1024 * 1024} // 50MB
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatClient;