import type { AnyTool, ToolRegistry } from "./types.js";
import type { Sandbox } from "../sandbox.js";
import createReadFileTool from "./readFile.js";
import createSandbox from "../sandbox.js";

export type ToolRegistryParams = {
  workspaceRoot: string;
};

export function createToolRegistry({ workspaceRoot }: ToolRegistryParams): ToolRegistry {
  const sandbox: Sandbox = createSandbox(workspaceRoot);

  const tools: AnyTool[] = [createReadFileTool(sandbox)];

  return new Map(tools.map((tool) => [tool.name, tool]));
}

export default createToolRegistry;
