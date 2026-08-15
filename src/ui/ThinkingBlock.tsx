import { Box, Text } from "ink";
import type { ThinkingEvent } from "./types.js";

type Props = { event: ThinkingEvent; expanded: boolean };

export default function ThinkingBlock({ event, expanded }: Props) {
  if (!expanded) return <Text dimColor>▸ thinking (press t to expand)</Text>;
  return (
    <Box flexDirection="column">
      <Text dimColor>▾ thinking</Text>
      <Text dimColor>{event.text}</Text>
    </Box>
  );
}
