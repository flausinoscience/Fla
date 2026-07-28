import type { TranscriptEvent } from "./types.js";

export type MockAgentHandle = {
  events: AsyncGenerator<TranscriptEvent>;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockAgent(task: string): MockAgentHandle {
  async function* run(): AsyncGenerator<TranscriptEvent> {
    yield { id: "1", type: "user", text: task };
    await delay(400);
    yield { id: "2", type: "thinking", text: "Checking the directory before writing anything." };
    await delay(2000);
    yield { id: "5", type: "assistant", text: "Thats cool... In order to do this..." };
  }

  return {
    events: run(),
  };
}
