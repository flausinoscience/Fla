import type { AgentEvent } from "../agent/types.js";
import type { ToolResult } from "../agent/tools/types.js";
import type { ToolCallEvent } from "./types.js";
import type { UIAction } from "./reducer.js";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function summarizeResult(result: ToolResult): string {
  switch (result.status) {
    case "ok":
      return typeof result.data === "string" ? result.data : JSON.stringify(result.data);
    case "error":
      return result.error;
    case "rejected":
      return result.reason;
  }
}

function statusFromResult(result: ToolResult): ToolCallEvent["status"] {
  if (result.status === "ok") return "success";
  if (result.status === "rejected") return "rejected";
  return "error";
}

export function toUIActions(event: AgentEvent): UIAction[] {
  switch (event.type) {
    case "assistant_message": {
      const actions: UIAction[] = [];
      if (event.reasoning) {
        actions.push({
          kind: "push_event",
          event: { id: nextId("thinking"), type: "thinking", text: event.reasoning },
        });
      }
      if (event.content) {
        actions.push({
          kind: "push_event",
          event: { id: nextId("assistant"), type: "assistant_message", text: event.content },
        });
      }
      return actions;
    }

    case "tool_call_requested":
      return [
        {
          kind: "upsert_tool_call",
          event: {
            id: event.toolCallId,
            type: "tool_call",
            name: event.toolName,
            args: event.arguments,
            status: "pending",
          },
        },
      ];

    case "approval_required":
      return [
        {
          kind: "upsert_tool_call",
          event: {
            id: event.toolCallId,
            type: "tool_call",
            name: event.toolName,
            args: event.arguments,
            status: "awaitingApproval",
          },
        },
      ];

    case "approval_resolved":
      return []; // tool_call_result supersedes this almost immediately — nothing to render

    case "tool_call_result":
      return [
        {
          kind: "upsert_tool_call",
          event: {
            id: event.toolCallId,
            type: "tool_call",
            name: event.toolName,
            status: statusFromResult(event.result),
            summary: summarizeResult(event.result),
          },
        },
      ];

    case "iteration_limit_reached":
      return [
        {
          kind: "push_event",
          event: {
            id: nextId("system"),
            type: "system",
            text: `Stopped after ${event.limit} iterations.`,
          },
        },
      ];

    case "error":
      return [
        {
          kind: "push_event",
          event: { id: nextId("system"), type: "system", text: `Error: ${event.message}` },
        },
      ];

    case "done":
      return [{ kind: "flush_pending" }]; // finalAnswer already arrived as its own assistant_message
  }
}
