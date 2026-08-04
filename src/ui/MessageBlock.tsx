import { Text } from "ink";
import type { MessageEvent } from "./types.js";

type MessageBlockProps = {
  event: MessageEvent;
};

export default function MessageBlock({ event }: MessageBlockProps) {
  if (event.type === "user") {
    return <Text color="green">&gt; {event.text}</Text>;
  }

  return <Text>{event.text}</Text>;
}
