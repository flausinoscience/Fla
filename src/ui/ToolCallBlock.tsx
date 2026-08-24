import { Text } from "ink";
import type { ToolCallEvent } from "./types.js";

const GLYPH: Record<ToolCallEvent["status"], string> = {
  pending: "◌",
  awaitingApproval: "?",
  success: "✓",
  error: "✗",
  rejected: "⊘",
};

const COLOR: Record<ToolCallEvent["status"], string> = {
  pending: "cyan",
  awaitingApproval: "yellow",
  success: "green",
  error: "red",
  rejected: "gray",
};

export default function ToolCallBlock({ event }: { event: ToolCallEvent }) {
  const argsText = event.args !== undefined ? JSON.stringify(event.args) : "";
  const summaryText = event.summary ? ` — ${event.summary}` : "";

  return (
    <Text color={COLOR[event.status]}>
      {GLYPH[event.status]} {event.name}({argsText}){summaryText}
    </Text>
  );
}
