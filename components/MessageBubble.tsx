'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { BotIcon } from "lucide-react";
import FileAttachment from "./FileAttachment";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
    content: string;
    isUser: boolean;
    attachments?: Array<{
        fileId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        fileUrl?: string;
        thumbnailUrl?: string;
    }>;
}

const formatMessage = (content: string): string => {
    //first unescape backslashes
    content = content.replace(/\\/g, "\\");

    //handle newlines
    content = content.replace(/\\n/g, "\n");

    //remove only the markers but keep content between them
    content = content.replace(/---START---\n?/g, "").replace(/\n?---END---/g, "");

    return content.trim();
};

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
            {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

function MessageBubble({ content, isUser, attachments }: MessageBubbleProps) {
    const { user } = useUser();

    return (
        <div className="flex flex-col gap-2 mb-4">
            <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2`}>
                {!isUser && (
                    <Avatar className="h-8 w-8">
                        <BotIcon className="h-5 w-5" />
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                )}
                <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] md:max-w-[75%] shadow-sm ring-1 ring-inset relative ${isUser
                        ? "bg-blue-600 text-white rounded-br-none ring-blue-700/50"
                        : "bg-white text-gray-900 rounded-bl-none ring-gray-200"
                        }`}
                >
                    <div className="space-y-3 prose prose-sm max-w-none text-current">
                        {/* Text Content */}
                        {content && (
                            <div className="markdown-content">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{ code: CodeBlock }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}

                        {/* File Attachments */}
                        {attachments && attachments.length > 0 && (
                            <div className="space-y-2 not-prose">
                                {attachments.map((attachment, index) => (
                                    <FileAttachment
                                        key={`${attachment.fileId}-${index}`}
                                        fileName={attachment.fileName}
                                        fileType={attachment.fileType}
                                        fileSize={attachment.fileSize}
                                        fileUrl={attachment.fileUrl}
                                        thumbnailUrl={attachment.thumbnailUrl}
                                        className={isUser ? "bg-blue-500/80" : "bg-gray-100"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {isUser && user && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                        <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                )}
            </div>
        </div>
    )
}

export default MessageBubble;