import { useState } from "react";
import { Box, Text, useInput } from "ink";

type InputProps = {
  onSubmit: (userPrompt: string) => Promise<void>;
};

export default function PromptBar({ onSubmit }: InputProps) {
  const [prompt, setPrompt] = useState("");

  useInput((input, key) => {
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
      <Text>&gt; </Text>
      <Text>{prompt}</Text>
      <Text color="gray">█</Text>
    </Box>
  );
}
