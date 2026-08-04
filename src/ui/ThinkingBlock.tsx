import { Box, Text } from "ink";
import type { ThinkingEvent } from "./types.js";

type ThinkingBlockProps = {
  event: ThinkingEvent;
  expanded: boolean;
};

export default function ThinkingBlock({ event, expanded }: ThinkingBlockProps) {
  if (!expanded) {
    return <Text dimColor>▸ Thinking (press t to expand)</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text dimColor>▾ Thinking</Text>
      <Text dimColor>{event.text}</Text>
    </Box>
  );
}
