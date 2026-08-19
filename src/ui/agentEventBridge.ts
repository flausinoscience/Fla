import type { AgentEvent } from "../agent/types.js";
import type { ToolResult } from "../agent/tools/types.js";
import type { ToolCallEvent } from "./types.js";
import type { UIAction } from "./reducer.js";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

// Tracks which UI event id this turn's streaming reasoning/content is
// currently updating. Reset once the turn finalizes (assistant_message) or
// aborts (error) — module-level is fine, only one run is ever active.
let reasoningStreamId: string | null = null;
let contentStreamId: string | null = null;

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
    case "assistant_delta": {
      if (event.channel === "reasoning") {
        reasoningStreamId ??= nextId("thinking");
        return [
          {
            kind: "push_event",
            event: { id: reasoningStreamId, type: "thinking", text: event.textSoFar },
          },
        ];
      }
      contentStreamId ??= nextId("assistant");
      return [
        {
          kind: "push_event",
          event: { id: contentStreamId, type: "assistant_message", text: event.textSoFar },
        },
      ];
    }

    case "assistant_message": {
      // Already streamed live via assistant_delta in the normal case — this
      // just marks the turn finalized. Only push fresh events as a fallback
      // if nothing actually streamed.
      const actions: UIAction[] = [];
      if (!reasoningStreamId && event.reasoning) {
        actions.push({
          kind: "push_event",
          event: { id: nextId("thinking"), type: "thinking", text: event.reasoning },
        });
      }
      if (!contentStreamId && event.content) {
        actions.push({
          kind: "push_event",
          event: { id: nextId("assistant"), type: "assistant_message", text: event.content },
        });
      }
      reasoningStreamId = null;
      contentStreamId = null;
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
      return [];

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
      // Also reset stream tracking here — my new "stream ended without a
      // final message" guard in loop.ts can fire mid-turn, after deltas
      // already claimed these ids. Without this reset, the next run would
      // wrongly merge fresh output into this aborted turn's stale ids.
      reasoningStreamId = null;
      contentStreamId = null;
      return [
        {
          kind: "push_event",
          event: { id: nextId("system"), type: "system", text: `Error: ${event.message}` },
        },
      ];

    case "done":
      return [{ kind: "flush_pending" }];
  }
}
