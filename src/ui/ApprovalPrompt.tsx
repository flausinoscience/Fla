import { useRef } from "react";
import { Box, Text, useInput } from "ink";
import type { ToolCallEvent } from "./types.js";

type Props = { event: ToolCallEvent; onAnswer: (approved: boolean) => void };

export default function ApprovalPrompt({ event, onAnswer }: Props) {
  const answeredRef = useRef(false);

  useInput((input, key) => {
    if (answeredRef.current) return;
    if (input === "y") {
      answeredRef.current = true;
      onAnswer(true);
    }
    if (input === "n" || key.escape) {
      answeredRef.current = true;
      onAnswer(false);
    }
  });

  const argsText = event.args !== undefined ? JSON.stringify(event.args) : "";

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">
        {event.name}
      </Text>
      <Text dimColor>{argsText}</Text>
      <Text>Approve? [y/N]</Text>
    </Box>
  );
}
