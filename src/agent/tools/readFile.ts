import fs from "fs/promises";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import type { Tool, ToolResult, ToolSchema, ToolValidationResult } from "./types.js";
import type { Sandbox } from "../sandbox.js";

const NAME = "read_file";

const DESCRIPTION = `
Read the full text contents of a single file inside the workspace. Use this
when you need to see what's in a file before answering a question about it,
checking if content exists, or before deciding whether to modify it. The path
must be relative to the workspace root (e.g. 'src/index.ts' or 'README.md')
— do not use absolute paths or '..' segments.`;

const readFileParams = z.object({
  path: z
    .string()
    .describe("Relative path to the file from the workspace root, e.g. 'src/index.ts'"),
});

type ReadFileArgs = z.infer<typeof readFileParams>;

function validate(args: unknown): ToolValidationResult<ReadFileArgs> {
  const results = readFileParams.safeParse(args);
  if (!results.success) {
    return { success: false, reason: fromZodError(results.error).message };
  }
  return { success: true, data: results.data };
}

const schema: ToolSchema<ReadFileArgs> = {
  parameters: z.toJSONSchema(readFileParams),
  validate,
};

function createExecute(sandbox: Sandbox) {
  return async function execute({ path }: ReadFileArgs): Promise<ToolResult> {
    const resolved = sandbox.resolvePath(path);
    if (!resolved.ok) {
      return { status: "error", error: resolved.error };
    }

    try {
      const content = await fs.readFile(resolved.absolutePath, "utf-8");
      return { status: "ok", data: { content } };
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        return { status: "error", error: `File not found: ${path}` };
      }
      if (err instanceof Error && "code" in err && err.code === "EISDIR") {
        return { status: "error", error: `Path is a directory, not a file: ${path}` };
      }
      return {
        status: "error",
        error: `Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };
}

function createReadFileTool(sandbox: Sandbox): Tool<ReadFileArgs> {
  return {
    name: NAME,
    description: DESCRIPTION,
    schema,
    execute: createExecute(sandbox),
    requiresApproval: false,
  };
}

export default createReadFileTool;
