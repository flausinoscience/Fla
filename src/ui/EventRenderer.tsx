import type { TranscriptEvent } from "./types.js";
import MessageBlock from "./MessageBlock.js";
import ThinkingBlock from "./ThinkingBlock.js";

export type EventRendererProps = {
  event: TranscriptEvent;
  expanded?: boolean;
};

export default function EventRenderer({ event, expanded }: EventRendererProps) {
  switch (event.type) {
    case "user":
    case "assistant":
      return <MessageBlock event={event} />;
    case "thinking":
      return <ThinkingBlock event={event} expanded={!!expanded} />;
    default:
      return <></>;
  }
}
