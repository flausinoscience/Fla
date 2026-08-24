import { Box, Text } from "ink";
import { parseMarkdown, type Block, type Run } from "./markdown.js";

type Props = { source: string };

function InlineRuns({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => {
        if (r.code)
          return (
            <Text key={i} color="cyan">
              {r.text}
            </Text>
          );
        if (r.link)
          return (
            <Text key={i} color="blue" underline>
              {r.text}
            </Text>
          );
        const bold = r.bold === true;
        const italic = r.italic === true;
        return (
          <Text key={i} bold={bold} italic={italic}>
            {r.text}
          </Text>
        );
      })}
    </>
  );
}

function BlockRow({ block }: { block: Block }) {
  switch (block.kind) {
    case "h": {
      if (block.level === 1) {
        return (
          <Text bold color="magenta">
            <InlineRuns runs={block.runs} />
          </Text>
        );
      }
      if (block.level === 2) {
        return (
          <Text bold color="blue">
            <InlineRuns runs={block.runs} />
          </Text>
        );
      }
      return (
        <Text bold>
          <InlineRuns runs={block.runs} />
        </Text>
      );
    }
    case "p":
      return (
        <Text>
          <InlineRuns runs={block.runs} />
        </Text>
      );
    case "code":
      return (
        <Text color="cyan" dimColor>
          {block.text}
        </Text>
      );
    case "ul":
      return (
        <Box flexDirection="column">
          {block.items.map((item, i) => (
            <Text key={i}>
              {"  • "}
              <InlineRuns runs={item} />
            </Text>
          ))}
        </Box>
      );
    case "ol":
      return (
        <Box flexDirection="column">
          {block.items.map((item, i) => (
            <Text key={i}>
              {`  ${i + 1}. `}
              <InlineRuns runs={item} />
            </Text>
          ))}
        </Box>
      );
    case "quote":
      return (
        <Text dimColor>
          {"> "}
          <InlineRuns runs={block.runs} />
        </Text>
      );
    case "hr":
      return <Text dimColor>{"─".repeat(40)}</Text>;
  }
}

export default function MarkdownView({ source }: Props) {
  const blocks = parseMarkdown(source);
  return (
    <Box flexDirection="column">
      {blocks.map((b, i) => (
        <BlockRow key={i} block={b} />
      ))}
    </Box>
  );
}
