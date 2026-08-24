import { useState } from "react";
import { Box, Text, useInput } from "ink";

type InputProps = {
  onSubmit: (userPrompt: string) => Promise<void>;
  disabled?: boolean;
};

export default function PromptBar({ onSubmit, disabled = false }: InputProps) {
  const [prompt, setPrompt] = useState("");
  const [cursorPos, setCursorPos] = useState(0);

  useInput((input, key) => {
    if (disabled) return;

    if (key.return) {
      if (prompt.trim().length > 0) {
        onSubmit(prompt).catch((e) => console.error(e));
        setPrompt("");
        setCursorPos(0);
      }
      return;
    }

    if (key.leftArrow) {
      setCursorPos((pos) => Math.max(0, pos - 1));
      return;
    }

    if (key.rightArrow) {
      setCursorPos((pos) => Math.min(prompt.length, pos + 1));
      return;
    }

    if (key.home) {
      setCursorPos(0);
      return;
    }

    if (key.end) {
      setCursorPos(prompt.length);
      return;
    }

    if (key.backspace) {
      if (cursorPos > 0) {
        setPrompt((current) => current.slice(0, cursorPos - 1) + current.slice(cursorPos));
        setCursorPos((pos) => pos - 1);
      }
      return;
    }

    if (key.delete) {
      if (cursorPos < prompt.length) {
        setPrompt((current) => current.slice(0, cursorPos) + current.slice(cursorPos + 1));
      }
      return;
    }

    if (!key.ctrl && !key.meta && input) {
      setPrompt((current) => current.slice(0, cursorPos) + input + current.slice(cursorPos));
      setCursorPos((pos) => pos + input.length);
    }
  });

  const before = prompt.slice(0, cursorPos);
  const atCursor = prompt[cursorPos] ?? " ";
  const after = prompt.slice(cursorPos + 1);

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text dimColor={disabled}>&gt; </Text>
      <Text dimColor={disabled}>{before}</Text>
      {!disabled ? <Text inverse>{atCursor}</Text> : <Text dimColor>{atCursor}</Text>}
      <Text dimColor={disabled}>{after}</Text>
    </Box>
  );
}
