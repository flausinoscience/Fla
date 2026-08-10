import type { ChatResponse, Message } from "./provider.js";
import { getToolSchemas } from "./toolRegistry.js";
import type { AgentEvent, AgentHandle, RunAgentFn } from "./types.js";

/**
 * Drives the ReAct (Reason -> Act -> Observe) loop until a task is
 * completed or a budget limit is reached
 */
const runAgent: RunAgentFn = function ({
  provider,
  registry,
  systemPrompt,
  history,
  task,
  maxIterations = 50,
}): AgentHandle {
  const seedMessages: Message[] =
    history.length === 0 ? [{ role: "system", content: systemPrompt }] : history;

  const messages: Message[] = [...seedMessages, { role: "user", content: task }];

  const pendingApprovals = new Map<string, (approved: boolean) => void>();

  async function* startLoop(): AsyncGenerator<AgentEvent> {
    for (let turn = 0; turn < maxIterations; turn++) {
      const response: ChatResponse = await provider.chat({
        messages,
        tools: getToolSchemas(registry),
      });
      const message = response.message;
      messages.push(message);

      if (message.content || message.reasoning) {
        const reasoning = message.reasoning;
        yield reasoning !== undefined
          ? { type: "assistant_message", content: message.content, reasoning }
          : { type: "assistant_message", content: message.content };
      }

      if (!message.toolCalls || message.toolCalls.length === 0) {
        yield { type: "done", finalAnswer: message.content || "" };
        return;
      }

      for (const call of message.toolCalls) {
        yield {
          type: "tool_call_requested",
          toolCallId: call.id,
          toolName: call.toolName,
          arguments: call.arguments,
        };

        const tool = registry.get(call.toolName);

        if (!tool) {
          const result = { status: "error" as const, error: `Tool "${call.toolName}" not found.` };
          messages.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.toolName,
            content: result,
          });
          yield { type: "tool_call_result", toolCallId: call.id, toolName: call.toolName, result };
          continue;
        }

        if (tool.requiresApproval) {
          yield {
            type: "approval_required",
            toolCallId: call.id,
            toolName: call.toolName,
            arguments: call.arguments,
          };

          const { promise, resolve } = Promise.withResolvers<boolean>();
          pendingApprovals.set(call.id, resolve);

          const approved = await promise;
          pendingApprovals.delete(call.id);

          yield { type: "approval_resolved", toolCallId: call.id, approved };

          if (!approved) {
            const result = { status: "rejected" as const, reason: "User rejected the tool call." };
            messages.push({
              role: "tool",
              toolCallId: call.id,
              toolName: call.toolName,
              content: result,
            });
            yield {
              type: "tool_call_result",
              toolCallId: call.id,
              toolName: call.toolName,
              result,
            };
            continue;
          }
        }

        const validated = tool.schema.validate(call.arguments);
        if (!validated.success) {
          const result = { status: "error" as const, error: validated.reason };
          messages.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.toolName,
            content: result,
          });
          yield { type: "tool_call_result", toolCallId: call.id, toolName: call.toolName, result };
          continue;
        }

        try {
          const result = await tool.execute(validated.data);
          messages.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.toolName,
            content: result,
          });
          yield { type: "tool_call_result", toolCallId: call.id, toolName: call.toolName, result };
        } catch (err) {
          const result = {
            status: "error" as const,
            error: `Execution failed: ${err instanceof Error ? err.message : String(err)}`,
          };
          messages.push({
            role: "tool",
            toolCallId: call.id,
            toolName: call.toolName,
            content: result,
          });
          yield { type: "tool_call_result", toolCallId: call.id, toolName: call.toolName, result };
        }
      }
    }

    yield { type: "iteration_limit_reached", limit: maxIterations };
  }

  return {
    events: startLoop(),
    approveToolCall: (callId: string, approved: boolean) => {
      const resolve = pendingApprovals.get(callId);
      if (resolve) resolve(approved);
    },
    getMessages(): Message[] {
      return [...messages];
    },
  };
};

export default runAgent;
