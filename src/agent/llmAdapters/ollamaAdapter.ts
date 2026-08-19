import { randomUUID } from "node:crypto";
import { Ollama } from "ollama";
import type {
  AssistantMessage,
  ChatChunk,
  ChatRequest,
  Message,
  Provider,
  ToolCall,
  ToolSchemaForProvider,
} from "../provider.js";

function toOllamaTools(tools: ToolSchemaForProvider[]) {
  return tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function toOllamaMessages(messages: Message[]) {
  return messages.map((message) => {
    switch (message.role) {
      case "system":
      case "user":
        return { role: message.role, content: message.content };
      case "assistant": {
        const toolCalls = message.toolCalls?.map((call) => ({
          function: { name: call.toolName, arguments: call.arguments as Record<string, unknown> },
        }));
        return toolCalls && toolCalls.length > 0
          ? { role: "assistant" as const, content: message.content, tool_calls: toolCalls }
          : { role: "assistant" as const, content: message.content };
      }
      case "tool":
        return {
          role: "tool" as const,
          tool_name: message.toolName,
          content: JSON.stringify(message.content),
        };
    }
  });
}

type OllamaResponseToolCall = { function: { name: string; arguments: unknown } };

function toCanonicalToolCalls(raw: OllamaResponseToolCall[] | undefined): ToolCall[] | undefined {
  if (!raw || raw.length === 0) return undefined;
  return raw.map((call) => ({
    id: randomUUID(),
    toolName: call.function.name,
    arguments: call.function.arguments,
  }));
}

export type OllamaProviderConfig = {
  model: string;
  host?: string;
};

export function createOllamaProvider({ model, host }: OllamaProviderConfig): Provider {
  const client = host ? new Ollama({ host }) : new Ollama();

  return {
    async *chat(request: ChatRequest): AsyncGenerator<ChatChunk> {
      const stream = await client.chat({
        model,
        messages: toOllamaMessages(request.messages),
        tools: toOllamaTools(request.tools),
        think: true,
        stream: true,
      });

      let reasoning = "";
      let content = "";
      let rawToolCalls: OllamaResponseToolCall[] | undefined;

      for await (const chunk of stream) {
        if (chunk.message.thinking) {
          reasoning += chunk.message.thinking;
          yield { type: "delta", channel: "reasoning", textSoFar: reasoning };
        }
        if (chunk.message.content) {
          content += chunk.message.content;
          yield { type: "delta", channel: "content", textSoFar: content };
        }
        if (chunk.message.tool_calls) {
          rawToolCalls = chunk.message.tool_calls; // arrives whole, typically on the last chunk
        }
      }

      const base = { role: "assistant" as const, content };
      const toolCalls = toCanonicalToolCalls(rawToolCalls);
      const withToolCalls = toolCalls ? { ...base, toolCalls } : base;
      const message: AssistantMessage = reasoning ? { ...withToolCalls, reasoning } : withToolCalls;

      yield { type: "final", message };
    },
  };
}

export default createOllamaProvider;
