import { Box, Text } from "ink";

interface AgentBannerProps {
  asciiArt: string;
  model: string;
  projectFolder: string;
  gitBranch: string;
  contextMaxTokens: number;
}

export default function AgentBanner({
  asciiArt,
  model,
  projectFolder,
  gitBranch,
  contextMaxTokens,
}: AgentBannerProps) {
  return (
    <Box flexDirection="row" width="100%" paddingY={1}>
      <Box flexShrink={0} width="60%">
        <Text color="cyan" wrap="truncate">
          {asciiArt}
        </Text>
      </Box>

      <Box flexDirection="column" width="40%" justifyContent="flex-start">
        <Text bold underline>
          Session
        </Text>
        <Text>
          <Text dimColor>Model: </Text>
          <Text color="green">{model}</Text>
        </Text>
        <Text>
          <Text dimColor>Project: </Text>
          <Text color="yellow">{projectFolder}</Text>
        </Text>
        <Text>
          <Text dimColor>Branch: </Text>
          <Text color="magenta">{gitBranch}</Text>
        </Text>
        <Text>
          <Text dimColor>Context: </Text>
          <Text color="blue">{contextMaxTokens.toLocaleString()} tokens</Text>
        </Text>
      </Box>
    </Box>
  );
}
