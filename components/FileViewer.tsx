'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    File,
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileSpreadsheet,
    Download,
    Eye,
    X,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileViewerProps {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl?: string;
    thumbnailUrl?: string;
    extractedText?: string;
    onClose?: () => void;
    className?: string;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-6 w-6" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-6 w-6" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-6 w-6" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
        return <FileSpreadsheet className="h-6 w-6" />;
    }
    return <File className="h-6 w-6" />;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileViewer: React.FC<FileViewerProps> = ({
    fileName,
    fileType,
    fileSize,
    fileUrl,
    thumbnailUrl,
    extractedText,
    onClose,
    className
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'preview' | 'text'>('preview');

    const handleDownload = () => {
        if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePreview = () => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    const isImage = fileType.startsWith('image/');
    const isVideo = fileType.startsWith('video/');
    const isAudio = fileType.startsWith('audio/');
    const isPreviewable = isImage || isVideo || isAudio || fileType.includes('pdf');
    const hasTextContent = extractedText && extractedText.trim().length > 0;

    return (
        <div className={cn("border rounded-lg bg-white shadow-sm", className)}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="text-gray-500">
                        {getFileIcon(fileType)}
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900 truncate">{fileName}</h3>
                        <p className="text-sm text-gray-500">{formatFileSize(fileSize)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {hasTextContent && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="h-8 w-8 p-0"
                        >
                            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                    )}

                    {isPreviewable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePreview}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                            title="Preview"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}

                    {fileUrl && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-green-600"
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    )}

                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                            title="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-4">
                    {/* Tabs */}
                    {hasTextContent && (
                        <div className="flex border-b mb-4">
                            <button
                                onClick={() => setActiveTab('preview')}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === 'preview'
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Preview
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                    activeTab === 'text'
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Text Content
                            </button>
                        </div>
                    )}

                    {/* Tab Content */}
                    <div className="min-h-[200px]">
                        {activeTab === 'preview' && (
                            <div className="space-y-4">
                                {isImage && thumbnailUrl && (
                                    <div className="flex justify-center">
                                        <img
                                            src={thumbnailUrl}
                                            alt={fileName}
                                            className="max-w-full max-h-64 object-contain rounded border"
                                        />
                                    </div>
                                )}

                                {isVideo && fileUrl && (
                                    <div className="flex justify-center">
                                        <video
                                            controls
                                            className="max-w-full max-h-64 rounded border"
                                        >
                                            <source src={fileUrl} type={fileType} />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                )}

                                {isAudio && fileUrl && (
                                    <div className="flex justify-center">
                                        <audio controls className="w-full">
                                            <source src={fileUrl} type={fileType} />
                                            Your browser does not support the audio tag.
                                        </audio>
                                    </div>
                                )}

                                {!isImage && !isVideo && !isAudio && (
                                    <div className="text-center text-gray-500 py-8">
                                        <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                        <p>Preview not available for this file type</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'text' && extractedText && (
                            <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                                    {extractedText}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileViewer; 