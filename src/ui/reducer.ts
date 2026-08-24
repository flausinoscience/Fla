import type { ToolCallEvent, TranscriptEvent } from "./types.js";

export type UIState = {
  committed: TranscriptEvent[];
  pending: TranscriptEvent | null;
  thinkingExpanded: boolean;
};

export type UIAction =
  | { kind: "push_event"; event: TranscriptEvent }
  | { kind: "upsert_tool_call"; event: ToolCallEvent }
  | { kind: "flush_pending" }
  | { kind: "toggle_thinking" };

export const initialState: UIState = {
  committed: [],
  pending: null,
  thinkingExpanded: false,
};

const TERMINAL_STATUSES: ReadonlySet<ToolCallEvent["status"]> = new Set([
  "success",
  "error",
  "rejected",
]);

export function reducer(state: UIState, action: UIAction): UIState {
  switch (action.kind) {
    case "push_event": {
      const incoming = action.event;
      const existing = state.pending;
      const isSameEvent = existing?.id === incoming.id;

      const committed = existing && !isSameEvent ? [...state.committed, existing] : state.committed;

      return {
        ...state,
        committed,
        pending: incoming,
        thinkingExpanded: isSameEvent ? state.thinkingExpanded : false,
      };
    }

    case "upsert_tool_call": {
      const incoming = action.event;
      const existing = state.pending;
      const sameCall = existing?.type === "tool_call" && existing.id === incoming.id;

      const priorCommitted =
        existing && !sameCall ? [...state.committed, existing] : state.committed;

      const merged: ToolCallEvent = sameCall ? { ...existing, ...incoming } : incoming;

      if (TERMINAL_STATUSES.has(merged.status)) {
        return { ...state, committed: [...priorCommitted, merged], pending: null };
      }
      return { ...state, committed: priorCommitted, pending: merged };
    }

    case "flush_pending": {
      if (!state.pending) return state;
      return { ...state, committed: [...state.committed, state.pending], pending: null };
    }

    case "toggle_thinking":
      return { ...state, thinkingExpanded: !state.thinkingExpanded };
  }
}
