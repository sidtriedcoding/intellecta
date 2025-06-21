import { Id } from "@/convex/_generated/dataModel";

//SSE CLIENTS
export const SSE_DATA_PREFIX = "data: " as const;
export const SSE_LINE_DELIMITER = "\n\n" as const;
export const SSE_DONE_MESSAGE = "[DONE]" as const;

export interface FileAttachment {
  fileId: Id<"files">;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface Message {
  _id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: number;
  isComplete?: boolean;
  attachments?: FileAttachment[];
}

export interface ChatRequest {
  chatId: Id<"chats">;
  content: string;
  role: "user" | "assistant";
  attachments?: FileAttachment[];
}

export interface StreamRequest {
  chatId: Id<"chats">;
  content: string;
  attachments?: FileAttachment[];
}

export interface StreamResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  userMessageId?: Id<"messages">;
  aiMessageId?: Id<"messages">;
  error?: string;
}

// Function to validate request body
export function validateRequestBody<T>(body: unknown, requiredFields: (keyof T)[]): body is T {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  for (const field of requiredFields) {
    if (!(field in body)) {
      return false;
    }
  }

  return true;
}

// Function to parse request body
export function parseRequestBody<T>(body: unknown, requiredFields: (keyof T)[]): T | null {
  if (!validateRequestBody<T>(body, requiredFields)) {
    return null;
  }
  return body as T;
}

// Function to create request body
export function createRequestBody<T>(data: Partial<T>): T {
  return data as T;
}

export enum StreamMessageType {
  CHUNK = "chunk",
  ERROR = "error",
  DONE = "done",
  TOKEN = "token",
  TOOL_START = "tool_start",
  TOOL_END = "tool_end",
  CONNECTED = "connected"
}

export interface BaseStreamMessage {
  type: StreamMessageType;
}

export interface TokenMessage extends BaseStreamMessage {
  type: StreamMessageType.TOKEN;
  token: string;
}

export interface ErrorMessage extends BaseStreamMessage {
  type: StreamMessageType.ERROR;
  error: string;
}

export interface ConnectedMessage extends BaseStreamMessage {
  type: StreamMessageType.CONNECTED;
}

export interface DoneMessage extends BaseStreamMessage {
  type: StreamMessageType.DONE;
}

export interface ToolStartMessage extends BaseStreamMessage {
  type: StreamMessageType.TOOL_START;
  tool: string;
  input: unknown;
}

export interface ToolEndMessage extends BaseStreamMessage {
  type: StreamMessageType.TOOL_END;
  tool: string;
  output: unknown;
}


export type StreamMessage =
  | TokenMessage
  | ErrorMessage
  | ConnectedMessage
  | DoneMessage
  | ToolStartMessage
  | ToolEndMessage;
