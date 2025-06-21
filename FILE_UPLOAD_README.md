# File Upload Feature Documentation

## Overview

The Intellecta chatbot now supports comprehensive file upload functionality, allowing users to upload various file types including images, documents, spreadsheets, and more. The AI can process and understand the content of these files to provide more contextual responses.

## Features

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP, SVG
- **Documents**: PDF, Word documents (.docx), Markdown files
- **Spreadsheets**: Excel files (.xlsx), CSV files
- **Text Files**: Plain text, JSON, XML
- **Media**: Video files, Audio files
- **Archives**: ZIP files

### File Upload Capabilities

1. **Drag & Drop Interface**: Modern drag-and-drop file upload with visual feedback
2. **Multiple File Upload**: Upload up to 10 files simultaneously
3. **File Size Limits**: Maximum 50MB per file
4. **Progress Tracking**: Real-time upload progress with status indicators
5. **File Validation**: Automatic file type and size validation
6. **Preview Support**: Preview images, videos, and audio files directly in the chat

### AI Integration

- **Content Extraction**: Automatically extract text content from uploaded files
- **Contextual Responses**: AI considers file content when generating responses
- **File References**: AI can reference specific files in conversations
- **Multi-file Analysis**: Process multiple files together for comprehensive analysis

## Technical Implementation

### Database Schema

The file upload system uses a new `files` table in Convex with the following structure:

```typescript
files: defineTable({
  userId: v.string(),
  fileName: v.string(),
  fileType: v.string(),
  fileSize: v.number(),
  mimeType: v.string(),
  storageId: v.string(),
  uploadedAt: v.number(),
  isProcessed: v.boolean(),
  extractedText: v.optional(v.string()),
  thumbnailUrl: v.optional(v.string()),
  metadata: v.optional(v.any()),
})
```

### Message Attachments

Messages now support file attachments:

```typescript
messages: defineTable({
  // ... existing fields
  attachments: v.optional(v.array(v.object({
    fileId: v.id("files"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  }))),
})
```

### API Endpoints

#### File Upload API (`/api/upload`)

- **POST**: Upload files with validation and processing
- **GET**: Retrieve user's uploaded files

#### Enhanced Chat API (`/api/chat/stream`)

- Now accepts `attachments` array in request body
- Processes file content before sending to AI
- Includes file information in conversation context

### Components

#### FileUpload Component
- Drag-and-drop interface
- File validation and progress tracking
- Support for multiple file types
- Error handling and user feedback

#### FileAttachment Component
- Display file attachments in messages
- Preview, download, and remove functionality
- File type icons and metadata display

#### FileViewer Component
- Expandable file preview interface
- Tabbed view for preview and text content
- Support for images, videos, and audio files

## Usage Examples

### Uploading Files

1. Click the paperclip icon in the chat interface
2. Drag and drop files or click to browse
3. Files are automatically uploaded and processed
4. Attach files to your message and send

### AI Interactions

```
User: "Can you analyze this spreadsheet and summarize the data?"
[Attaches Excel file]

AI: "I've analyzed the spreadsheet 'sales_data.xlsx'. Here's a summary of the key findings:
- Total sales: $125,000
- Top performing product: Product A
- Sales trend: Increasing by 15% month-over-month
..."
```

### File Management

- View uploaded files in the chat history
- Download files for offline access
- Preview file content directly in the interface
- Remove files from conversations

## File Processing Pipeline

1. **Upload**: Files are uploaded via the `/api/upload` endpoint
2. **Storage**: Files are stored in the database with metadata
3. **Processing**: File content is extracted based on file type
4. **AI Integration**: Extracted content is included in AI conversations
5. **Display**: Files are shown as attachments in messages

## Security Features

- File type validation to prevent malicious uploads
- File size limits to prevent abuse
- User authentication required for all uploads
- Secure file storage with access controls

## Future Enhancements

- **OCR Integration**: Extract text from images using optical character recognition
- **Cloud Storage**: Integrate with cloud storage providers (AWS S3, Google Cloud Storage)
- **File Versioning**: Support for file versioning and history
- **Collaborative Features**: Share files between users
- **Advanced Processing**: Support for more file formats and processing options

## Configuration

### Environment Variables

No additional environment variables are required for basic functionality. For production deployments, consider:

- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)
- `ALLOWED_FILE_TYPES`: Comma-separated list of allowed MIME types
- `STORAGE_PROVIDER`: Cloud storage provider configuration

### File Size Limits

- Default maximum: 50MB per file
- Configurable via environment variables
- Client-side validation for immediate feedback

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (must be under 50MB)
   - Verify file type is supported
   - Ensure user is authenticated

2. **File Processing Errors**
   - Check server logs for processing errors
   - Verify file format is valid
   - Ensure sufficient server resources

3. **Preview Not Working**
   - Check if file type supports preview
   - Verify file URL is accessible
   - Check browser console for errors

### Error Messages

- "File too large": File exceeds size limit
- "Unsupported file type": File type not allowed
- "Upload failed": Network or server error
- "Processing failed": File content extraction error

## Performance Considerations

- Files are processed asynchronously to avoid blocking the UI
- Large files are processed in the background
- File content is cached to avoid reprocessing
- Thumbnails are generated for images to improve performance

## Contributing

To extend the file upload functionality:

1. Add new file type support in `lib/fileProcessor.ts`
2. Update file validation in `/api/upload/route.ts`
3. Add new file type icons in components
4. Update documentation and tests

## Support

For issues or questions about the file upload feature:

1. Check the troubleshooting section
2. Review server logs for error details
3. Test with different file types and sizes
4. Contact the development team for assistance 