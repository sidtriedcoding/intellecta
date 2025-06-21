'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
    File,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileSpreadsheet,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileAttachmentProps {
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl?: string;
    onRemove?: () => void;
    className?: string;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-5 w-5 text-pink-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileAttachment: React.FC<FileAttachmentProps> = ({
    fileName,
    fileType,
    fileSize,
    thumbnailUrl,
    onRemove,
    className
}) => {
    const isImage = fileType.startsWith('image/');

    return (
        <div className={cn("flex items-center gap-3 p-2 border rounded-lg bg-gray-50/70", className)}>
            {isImage && thumbnailUrl ? (
                <img src={thumbnailUrl} alt={fileName} className="h-10 w-10 rounded-md object-cover" />
            ) : (
                <div className="flex-shrink-0 text-gray-500 h-10 w-10 flex items-center justify-center bg-gray-200 rounded-md">
                    {getFileIcon(fileType)}
                </div>
            )}

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
            </div>

            <div className="flex items-center gap-1">
                {onRemove && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-100"
                        title="Remove"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default FileAttachment; 