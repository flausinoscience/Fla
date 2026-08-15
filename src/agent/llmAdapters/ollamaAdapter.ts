import { randomUUID } from "node:crypto";
import { Ollama } from "ollama";
import type {
  AssistantMessage,
  ChatRequest,
  ChatResponse,
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
        // Ollama's own tool_calls shape has no `id` — our canonical id is an
        // internal-only concept invented by this adapter , so it
        // is deliberately dropped here rather than sent somewhere Ollama
        // doesn't expect it.
        const toolCalls = message.toolCalls?.map((call) => ({
          function: { name: call.toolName, arguments: call.arguments as Record<string, unknown> },
        }));
        return toolCalls && toolCalls.length > 0
          ? { role: "assistant" as const, content: message.content, tool_calls: toolCalls }
          : { role: "assistant" as const, content: message.content };
      }

      case "tool":
        // Ollama correlates a tool result to a call by `tool_name`, not by
        // an id — our toolCallId has no equivalent slot on the wire and is
        // intentionally not sent.
        return {
          role: "tool" as const,
          tool_name: message.toolName,
          content: JSON.stringify(message.content),
        };
    }
  });
}

type OllamaResponseToolCall = { function: { name: string; arguments: unknown } };
type OllamaResponseMessage = {
  content: string;
  thinking?: string;
  tool_calls?: OllamaResponseToolCall[];
};

function toCanonicalToolCalls(raw: OllamaResponseToolCall[] | undefined): ToolCall[] | undefined {
  if (!raw || raw.length === 0) return undefined;
  // Synthesizing an id here, once, at the one boundary that knows Ollama
  // doesn't provide one — everything downstream (the loop, the UI) gets to
  // assume every tool call always has a stable id, no special-casing needed.
  return raw.map((call) => ({
    id: randomUUID(),
    toolName: call.function.name,
    arguments: call.function.arguments,
  }));
}

function toCanonicalAssistantMessage(message: OllamaResponseMessage): AssistantMessage {
  const base = { role: "assistant" as const, content: message.content };

  const toolCalls = toCanonicalToolCalls(message.tool_calls);
  const withToolCalls = toolCalls ? { ...base, toolCalls } : base;

  // `thinking` maps to our canonical `reasoning` field — see provider.ts's
  // note on why this has to stay optional and provider-specific.
  return message.thinking ? { ...withToolCalls, reasoning: message.thinking } : withToolCalls;
}

// --- Provider ------------------------------------------------------------

export type OllamaProviderConfig = {
  model: string; // exact local tag, e.g. whatever `ollama list` shows — not guessed here
  host?: string;
};

export function createOllamaProvider({ model, host }: OllamaProviderConfig): Provider {
  const client = host ? new Ollama({ host }) : new Ollama();

  return {
    async chat(request: ChatRequest): Promise<ChatResponse> {
      const response = await client.chat({
        model,
        messages: toOllamaMessages(request.messages),
        tools: toOllamaTools(request.tools),
        think: true, // Gemma's reasoning output — degrades harmlessly if unsupported
      });

      return { message: toCanonicalAssistantMessage(response.message) };
    },
  };
}

export default createOllamaProvider;
