import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface FileProcessingResult {
    extractedText: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
}

interface FileRecord {
    _id: Id<"files">;
    fileName: string;
    fileType: string;
    mimeType: string;
    isProcessed: boolean;
    extractedText?: string;
    thumbnailUrl?: string;
    metadata?: Record<string, unknown>;
}

export class FileProcessor {
    private convex: ReturnType<typeof getConvexClient>;

    constructor(token: string) {
        this.convex = getConvexClient(token);
    }

    async processFile(fileId: string): Promise<FileProcessingResult> {
        try {
            // Get file record from Convex
            const fileRecord = await this.convex.query(api.files.getById, { fileId: fileId as Id<"files"> });

            if (!fileRecord) {
                throw new Error("File not found");
            }

            // Check if file is already processed
            if (fileRecord.isProcessed && fileRecord.extractedText) {
                return {
                    extractedText: fileRecord.extractedText,
                    thumbnailUrl: fileRecord.thumbnailUrl,
                    metadata: fileRecord.metadata,
                };
            }

            let extractedText = "";
            let thumbnailUrl: string | undefined;
            const metadata: Record<string, unknown> = {};

            // Process based on file type
            const fileType = fileRecord.mimeType || fileRecord.fileType;

            if (fileType.startsWith('text/')) {
                // Text files
                extractedText = await this.extractTextFromTextFile(fileRecord);
            } else if (fileType.includes('pdf')) {
                // PDF files
                extractedText = await this.extractTextFromPDF(fileRecord);
            } else if (fileType.includes('word') || fileType.includes('document')) {
                // Word documents
                extractedText = await this.extractTextFromWordDocument(fileRecord);
            } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
                // Spreadsheets
                extractedText = await this.extractTextFromSpreadsheet(fileRecord);
            } else if (fileType.startsWith('image/')) {
                // Images
                const result = await this.extractTextFromImage(fileRecord);
                extractedText = result.extractedText;
                thumbnailUrl = result.thumbnailUrl;
            } else if (fileType.includes('json')) {
                // JSON files
                extractedText = await this.extractTextFromJSON(fileRecord);
            } else if (fileType.includes('markdown') || fileType.includes('md')) {
                // Markdown files
                extractedText = await this.extractTextFromMarkdown(fileRecord);
            } else {
                // Default: treat as text
                extractedText = await this.extractTextFromTextFile(fileRecord);
            }

            // Update file record with extracted content
            await this.convex.mutation(api.files.updateProcessingStatus, {
                fileId: fileId as Id<"files">,
                isProcessed: true,
                extractedText,
                thumbnailUrl,
            });

            return {
                extractedText,
                thumbnailUrl,
                metadata,
            };

        } catch (error) {
            console.error(`Error processing file ${fileId}:`, error);
            throw error;
        }
    }

    private async extractTextFromTextFile(fileRecord: FileRecord): Promise<string> {
        try {
            // For text files, the content might be stored in metadata
            if (fileRecord.metadata?.base64Data) {
                const buffer = Buffer.from(fileRecord.metadata.base64Data as string, 'base64');
                return buffer.toString('utf-8');
            }
            return `[Text file: ${fileRecord.fileName}]`;
        } catch (error) {
            console.error('Error extracting text from text file:', error);
            return `[Error processing text file: ${fileRecord.fileName}]`;
        }
    }

    private async extractTextFromPDF(fileRecord: FileRecord): Promise<string> {
        try {
            // In a real implementation, you would use a PDF parsing library
            // For now, return a placeholder
            return `[PDF file: ${fileRecord.fileName} - Content extraction would be implemented with a PDF parser]`;
        } catch (error) {
            console.error('Error extracting text from PDF:', error);
            return `[Error processing PDF: ${fileRecord.fileName}]`;
        }
    }

    private async extractTextFromWordDocument(fileRecord: FileRecord): Promise<string> {
        try {
            // In a real implementation, you would use a Word document parsing library
            return `[Word document: ${fileRecord.fileName} - Content extraction would be implemented with a Word parser]`;
        } catch (error) {
            console.error('Error extracting text from Word document:', error);
            return `[Error processing Word document: ${fileRecord.fileName}]`;
        }
    }

    private async extractTextFromSpreadsheet(fileRecord: FileRecord): Promise<string> {
        try {
            // In a real implementation, you would use a spreadsheet parsing library
            return `[Spreadsheet: ${fileRecord.fileName} - Content extraction would be implemented with a spreadsheet parser]`;
        } catch (error) {
            console.error('Error extracting text from spreadsheet:', error);
            return `[Error processing spreadsheet: ${fileRecord.fileName}]`;
        }
    }

    private async extractTextFromImage(fileRecord: FileRecord): Promise<{ extractedText: string; thumbnailUrl?: string }> {
        try {
            // In a real implementation, you would use OCR (Optical Character Recognition)
            // For now, return a placeholder
            const thumbnailUrl = fileRecord.metadata?.base64Data
                ? `data:${fileRecord.mimeType};base64,${fileRecord.metadata.base64Data as string}`
                : undefined;

            return {
                extractedText: `[Image: ${fileRecord.fileName} - OCR would be implemented to extract text from images]`,
                thumbnailUrl,
            };
        } catch (error) {
            console.error('Error extracting text from image:', error);
            return {
                extractedText: `[Error processing image: ${fileRecord.fileName}]`,
            };
        }
    }

    private async extractTextFromJSON(fileRecord: FileRecord): Promise<string> {
        try {
            if (fileRecord.metadata?.base64Data) {
                const buffer = Buffer.from(fileRecord.metadata.base64Data as string, 'base64');
                const jsonContent = buffer.toString('utf-8');
                const parsed = JSON.parse(jsonContent);
                return JSON.stringify(parsed, null, 2);
            }
            return `[JSON file: ${fileRecord.fileName}]`;
        } catch (error) {
            console.error('Error extracting text from JSON:', error);
            return `[Error processing JSON: ${fileRecord.fileName}]`;
        }
    }

    private async extractTextFromMarkdown(fileRecord: FileRecord): Promise<string> {
        try {
            if (fileRecord.metadata?.base64Data) {
                const buffer = Buffer.from(fileRecord.metadata.base64Data as string, 'base64');
                return buffer.toString('utf-8');
            }
            return `[Markdown file: ${fileRecord.fileName}]`;
        } catch (error) {
            console.error('Error extracting text from Markdown:', error);
            return `[Error processing Markdown: ${fileRecord.fileName}]`;
        }
    }
}

// Helper function to process files in the background
export async function processFilesInBackground(fileIds: string[], token: string) {
    const processor = new FileProcessor(token);

    for (const fileId of fileIds) {
        try {
            await processor.processFile(fileId);
        } catch (error) {
            console.error(`Background processing failed for file ${fileId}:`, error);
        }
    }
} 