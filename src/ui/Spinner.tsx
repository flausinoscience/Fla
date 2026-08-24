import { Text, useAnimation } from "ink";

const characters = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function useSpinnerCharacter(): string {
  const { frame } = useAnimation({ interval: 80 });
  return characters[frame % characters.length]!;
}

export default function Spinner() {
  return <Text dimColor>{useSpinnerCharacter()} Working...</Text>;
}
