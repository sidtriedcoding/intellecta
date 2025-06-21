import {
    SSE_DONE_MESSAGE,
    StreamMessageType,
    SSE_DATA_PREFIX,
    StreamMessage,
} from "./types";

//creates a parser for SSE (Server-sent events) streams
// SSE allows real-time updates from server to client

export const createSSEParser = () => {
    let buffer = "";

    const parse = (chunk: string): StreamMessage[] => {
        //combine buffer with new chunk and split into lines
        const lines = (buffer + chunk).split("\n");

        buffer = lines.pop() || "";

        return lines
            .map((line) => {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith(SSE_DATA_PREFIX)) return null;

                const messageData = trimmed.substring(SSE_DATA_PREFIX.length);
                if (messageData === SSE_DONE_MESSAGE) return { type: StreamMessageType.DONE };

                try {
                    const parsedData = JSON.parse(messageData) as StreamMessage;
                    return Object.values(StreamMessageType).includes(parsedData.type)
                        ? parsedData
                        : null;
                } catch {
                    return {
                        type: StreamMessageType.ERROR,
                        error: "failed to parse SSE message",
                    };
                }
            })
            .filter((msg): msg is StreamMessage => msg !== null);
    };

    return { parse };
};
