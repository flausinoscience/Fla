import { Text } from "ink";
import type { TranscriptEvent } from "./types.js";
import MessageBlock from "./MessageBlock.js";
import ThinkingBlock from "./ThinkingBlock.js";
import ToolCallBlock from "./ToolCallBlock.js";

type Props = { event: TranscriptEvent; expanded?: boolean };

export default function EventRenderer({ event, expanded }: Props) {
  switch (event.type) {
    case "user_message":
    case "assistant_message":
      return <MessageBlock event={event} />;
    case "thinking":
      return <ThinkingBlock event={event} expanded={!!expanded} />;
    case "tool_call":
      return <ToolCallBlock event={event} />;
    case "system":
      return <Text dimColor>{event.text}</Text>;
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = event;
      return null;
    }
  }
}
