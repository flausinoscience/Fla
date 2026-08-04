import { Box, Static } from "ink";
import PromptBar from "./PromptBar.js";
import EventRenderer from "./EventRenderer.js";
import { useReducer, useRef } from "react";
import { initialState, reducer } from "./reducer.js";
import { createMockAgent, type MockAgentHandle } from "./agentMock.js";

export function App() {
  const [currentUIState, dispatch] = useReducer(reducer, initialState);
  const handleRef = useRef<MockAgentHandle | null>(null);

  async function handleSubmit(prompt: string) {
    dispatch({ kind: "commitCurrentEvent" });

    const handle = createMockAgent(prompt);
    handleRef.current = handle;

    for await (const event of handle.events) {
      dispatch({ kind: "pushEvent", event });
    }

    dispatch({ kind: "commitCurrentEvent" });
    handleRef.current = null;
  }

  return (
    <Box flexDirection="column">
      <Static items={currentUIState.committed}>
        {(event) => <EventRenderer key={event.id} event={event} />}
      </Static>

      <Box flexDirection="column">
        {currentUIState.currentEvent && (
          <EventRenderer
            expanded={currentUIState.thinkingExpanded}
            event={currentUIState.currentEvent}
          />
        )}

        <PromptBar onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
