import type { Message, Provider } from "./provider.js";
import type { ToolRegistry, ToolResult } from "./tools/types.js";

export type AgentEvent =
  | { type: "assistant_message"; content: string }
  | { type: "tool_call_requested"; toolCallId: string; toolName: string; arguments: unknown }
  | { type: "tool_call_result"; toolCallId: string; toolName: string; result: ToolResult }
  | { type: "approval_required"; toolCallId: string; toolName: string; arguments: unknown }
  | { type: "approval_resolved"; toolCallId: string; approved: boolean }
  | { type: "iteration_limit_reached"; limit: number }
  | { type: "done"; finalAnswer: string }
  | { type: "error"; message: string };

export type AgentHandle = {
  events: AsyncGenerator<AgentEvent>;
  approveToolCall: (callId: string, approved: boolean) => void;
  getMessages: () => Message[];
};

export type RunAgentFn = (params: {
  provider: Provider;
  registry: ToolRegistry;
  systemPrompt: string;
  history: Message[];
  task: string;
  maxIterations?: number;
}) => AgentHandle;
