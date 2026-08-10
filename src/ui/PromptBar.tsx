import { useState } from "react";
import { Box, Text, useInput } from "ink";

type InputProps = {
  onSubmit: (userPrompt: string) => Promise<void>;
  disabled?: boolean;
};

export default function PromptBar({ onSubmit, disabled = false }: InputProps) {
  const [prompt, setPrompt] = useState("");

  useInput((input, key) => {
    if (disabled) return;
    if (key.return) {
      if (prompt.trim().length > 0) {
        onSubmit(prompt).catch((e) => console.error(e));
        setPrompt("");
      }
      return;
    }
    if (key.backspace || key.delete) {
      setPrompt((currentPrompt) => currentPrompt.slice(0, -1));
      return;
    }
    if (!key.ctrl && !key.meta && input) {
      setPrompt((currentPrompt) => currentPrompt + input);
    }
  });

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1}>
      <Text dimColor={disabled}>&gt; </Text>
      <Text dimColor={disabled}>{prompt}</Text>
      {!disabled && <Text color="gray">█</Text>}
    </Box>
  );
}
