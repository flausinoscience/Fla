export type MessageEvent = { id: string; type: "user" | "assistant"; text: string };
export type ThinkingEvent = { id: string; type: "thinking"; text: string };
export type TranscriptEvent = MessageEvent | ThinkingEvent;
