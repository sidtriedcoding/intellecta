'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    Upload,
    File,
    X,
    CheckCircle,
    AlertCircle,
    FileText,
    FileSpreadsheet,
    FileImage,
    FileVideo,
    FileAudio,
    Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    onUploadComplete?: (fileIds: string[]) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
    acceptedFileTypes?: string[];
    children?: React.ReactNode;
}

interface UploadingFile {
    file: File;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-6 w-6 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-6 w-6 text-pink-500" />;
    if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    }
    return <File className="h-6 w-6 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({
    onFilesSelected,
    onUploadComplete,
    maxFiles = 10,
    maxSize = 50 * 1024 * 1024, // 50MB
    acceptedFileTypes = [
        'image/*',
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/json',
        'text/markdown',
        'application/zip',
        'video/*',
        'audio/*'
    ],
    children
}) => {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [open, setOpen] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        if (fileRejections.length > 0) {
            const error = fileRejections[0].errors[0];
            alert(`File error: ${error.message}`);
            return;
        }

        if (acceptedFiles.length === 0) return;

        const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
            file,
            progress: 0,
            status: 'uploading'
        }));

        setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

        try {
            await onFilesSelected(acceptedFiles);
            setUploadingFiles(prev => prev.map(f => ({ ...f, status: 'completed' as const, progress: 100 })));
            setTimeout(() => {
                setOpen(false);
                setUploadingFiles([]);
            }, 1000);

            // Call the callback with the files
            if (onUploadComplete) {
                // In a real implementation, you'd get actual file IDs from your upload service
                const fileIds = acceptedFiles.map((_, index) => `file-${Date.now()}-${index}`);
                onUploadComplete(fileIds);
            }

        } catch (error) {
            console.error('Upload error:', error);
            setUploadingFiles(prev =>
                prev.map(f => ({ ...f, status: 'error' as const, error: 'Upload failed' }))
            );
        }
    }, [onFilesSelected, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
        maxFiles,
        maxSize,
    });

    const removeFile = (index: number) => {
        setUploadingFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button variant="outline">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attach Files
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Upload Files</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                            isDragActive
                                ? "border-blue-500 bg-blue-50/50"
                                : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2 text-gray-600">
                            <Upload className="h-10 w-10" />
                            <span className="font-medium">
                                {isDragActive ? 'Drop to upload' : 'Drag & drop files or click to browse'}
                            </span>
                            <p className="text-xs text-gray-400">
                                Max {maxFiles} files, up to {formatFileSize(maxSize)} each.
                            </p>
                        </div>
                    </div>

                    {uploadingFiles.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-medium text-gray-800">Uploading...</h3>
                            <div className="space-y-2">
                                {uploadingFiles.map((upload, index) => (
                                    <div key={index} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                                        <div className="flex-shrink-0">
                                            {upload.status === 'completed' ? (
                                                <CheckCircle className="h-6 w-6 text-green-500" />
                                            ) : upload.status === 'error' ? (
                                                <AlertCircle className="h-6 w-6 text-red-500" />
                                            ) : (
                                                getFileIcon(upload.file.type)
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{upload.file.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{formatFileSize(upload.file.size)}</span>
                                                {upload.status === 'uploading' && (
                                                    <Progress value={upload.progress} className="h-1 w-24" />
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FileUpload; 