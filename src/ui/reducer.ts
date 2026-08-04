import type { TranscriptEvent } from "./types.js";

export type UIState = {
  committed: TranscriptEvent[];
  currentEvent: TranscriptEvent | null;
  thinkingExpanded: boolean; // only for current event
};

export type UIAction =
  | { kind: "pushEvent"; event: TranscriptEvent }
  | { kind: "commitCurrentEvent" }
  | { kind: "toggleThinking" };

export const initialState: UIState = {
  committed: [],
  currentEvent: null,
  thinkingExpanded: false,
};

export function reducer(currentState: UIState, action: UIAction): UIState {
  const newState = { ...currentState };

  switch (action.kind) {
    case "pushEvent": {
      if (currentState.currentEvent) {
        newState.committed = [...currentState.committed, currentState.currentEvent];
      }

      newState.currentEvent = action.event;
      newState.thinkingExpanded = false;

      return newState;
    }

    case "commitCurrentEvent": {
      if (!currentState.currentEvent) {
        return currentState;
      }

      newState.committed = [...currentState.committed, currentState.currentEvent];
      newState.currentEvent = null;

      return newState;
    }

    case "toggleThinking": {
      newState.thinkingExpanded = !currentState.thinkingExpanded;

      return newState;
    }
  }
}
