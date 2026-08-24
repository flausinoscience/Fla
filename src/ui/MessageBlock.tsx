import { Text } from "ink";
import type { MessageEvent } from "./types.js";
import MarkdownView from "./MarkdownView.js";

export default function MessageBlock({ event }: { event: MessageEvent }) {
  if (event.type === "user_message") return <Text color="green">&gt; {event.text}</Text>;
  return <MarkdownView source={event.text} />;
}
