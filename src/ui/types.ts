export type MessageEvent = {
  id: string;
  type: "user_message" | "assistant_message";
  text: string;
};

export type ThinkingEvent = {
  id: string;
  type: "thinking";
  text: string;
};

export type SystemEvent = {
  id: string;
  type: "system";
  text: string;
};

export type ToolCallStatus = "pending" | "awaitingApproval" | "success" | "error" | "rejected";

export type ToolCallEvent = {
  id: string;
  type: "tool_call";
  name: string;
  args?: unknown;
  status: ToolCallStatus;
  summary?: string; // populated once status reaches a terminal state
};

export type TranscriptEvent = MessageEvent | ThinkingEvent | SystemEvent | ToolCallEvent;
