import type { ParametersSchema, ToolResult } from "./tools/types.js";

export type ToolCall = {
  id: string;
  toolName: string;
  arguments: unknown;
};

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      toolCalls?: ToolCall[];
      reasoning?: string;
    }
  | { role: "tool"; toolCallId: string; toolName: string; content: ToolResult };

export type ToolSchemaForProvider = {
  name: string;
  description: string;
  parameters: ParametersSchema;
};

export type ChatRequest = {
  messages: Message[];
  tools: ToolSchemaForProvider[];
};

export type AssistantMessage = Extract<Message, { role: "assistant" }>;

export type ChatResponse = {
  message: AssistantMessage;
};

export interface Provider {
  chat(request: ChatRequest): Promise<ChatResponse>;
}
