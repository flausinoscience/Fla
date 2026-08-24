import { randomUUID } from "node:crypto";
import { useReducer, useRef, useState } from "react";
import { Box, Static, useInput } from "ink";
import EventRenderer from "./EventRenderer.js";
import PromptBar from "./PromptBar.js";
import ApprovalPrompt from "./ApprovalPrompt.js";
import Spinner from "./Spinner.js";
import { reducer, initialState } from "./reducer.js";
import { toUIActions } from "./agentEventBridge.js";
import runAgent from "../agent/loop.js";
import type { AgentHandle } from "../agent/types.js";
import type { Message, Provider } from "../agent/provider.js";
import type { ToolRegistry } from "../agent/tools/types.js";

type AppProps = {
  provider: Provider;
  registry: ToolRegistry;
  systemPrompt: string;
};

export default function App({ provider, registry, systemPrompt }: AppProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isRunning, setIsRunning] = useState(false);
  const agent = useRef<AgentHandle | null>(null);
  const historyRef = useRef<Message[]>([]); // carries conversation across turns

  async function handleSubmit(task: string) {
    dispatch({ kind: "push_event", event: { id: randomUUID(), type: "user_message", text: task } });
    setIsRunning(true);

    const handle = runAgent({
      provider,
      registry,
      systemPrompt,
      history: historyRef.current,
      task,
      maxIterations: 50,
    });
    agent.current = handle;

    for await (const agentEvent of handle.events) {
      for (const uiAction of toUIActions(agentEvent)) {
        dispatch(uiAction);
      }
    }

    historyRef.current = handle.getMessages();
    agent.current = null;
    setIsRunning(false);
  }

  function handleAnswer(approved: boolean) {
    if (state.pending?.type === "tool_call" && agent.current) {
      agent.current.approveToolCall(state.pending.id, approved);
    }
  }

  useInput((input) => {
    if (input === "t" && state.pending?.type === "thinking") {
      dispatch({ kind: "toggle_thinking" });
    }
  });

  const awaitingApproval =
    state.pending?.type === "tool_call" && state.pending.status === "awaitingApproval";
  const showSpinner = isRunning && !awaitingApproval;

  return (
    <Box flexDirection="column">
      <Static items={state.committed}>
        {(event) => <EventRenderer key={event.id} event={event} />}
      </Static>

      <Box flexDirection="column">
        {state.pending && <EventRenderer event={state.pending} expanded={state.thinkingExpanded} />}

        {showSpinner && <Spinner />}

        {awaitingApproval && state.pending?.type === "tool_call" ? (
          <ApprovalPrompt event={state.pending} onAnswer={handleAnswer} />
        ) : (
          <PromptBar onSubmit={handleSubmit} disabled={isRunning} />
        )}
      </Box>
    </Box>
  );
}
