import type { Sandbox } from "./sandbox.js";
import createReadDirectoryTool from "./tools/readDirectory.js";
import createReadFileTool from "./tools/readFile.js";
import createWriteFileTool from "./tools/writeFile.js";
import createSandbox from "./sandbox.js";
import type { AnyTool, ToolRegistry, ToolRegistryParams } from "./tools/types.js";
import type { ToolSchemaForProvider } from "./provider.js";

export function createToolRegistry({ workspaceRoot }: ToolRegistryParams): ToolRegistry {
  const sandbox: Sandbox = createSandbox(workspaceRoot);

  const tools: AnyTool[] = [
    createReadFileTool(sandbox),
    createReadDirectoryTool(sandbox),
    createWriteFileTool(sandbox),
  ];

  return new Map(tools.map((tool) => [tool.name, tool]));
}

export function getToolSchemas(registry: ToolRegistry): ToolSchemaForProvider[] {
  return Array.from(registry.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.schema.parameters,
  }));
}
