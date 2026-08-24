import fs from "fs/promises";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import type { Tool, ToolResult, ToolSchema, ToolValidationResult } from "./types.js";
import type { Sandbox } from "../sandbox.js";

const NAME = "read_directory";

const DESCRIPTION = `
List the immediate contents of a directory inside the workspace. Use this to
discover what files and subdirectories exist before deciding which to read.
The path must be relative to the workspace root (e.g. 'src/agent' or '.') —
do not use absolute paths or '..' segments. Only one level of contents is
returned; to inspect a subdirectory, call this tool again with that path. All
entries are included, including hidden ones like '.git'.`;

const readDirectoryParams = z.object({
  path: z.string().describe("Relative path to the directory from the workspace root"),
});

type ReadDirectoryArgs = z.infer<typeof readDirectoryParams>;

function validate(args: unknown): ToolValidationResult<ReadDirectoryArgs> {
  const results = readDirectoryParams.safeParse(args);
  if (!results.success) {
    return { success: false, reason: fromZodError(results.error).message };
  }
  return { success: true, data: results.data };
}

const schema: ToolSchema<ReadDirectoryArgs> = {
  parameters: z.toJSONSchema(readDirectoryParams),
  validate,
};

function createExecute(sandbox: Sandbox) {
  return async function execute({ path }: ReadDirectoryArgs): Promise<ToolResult> {
    const resolved = sandbox.resolvePath(path);
    if (!resolved.ok) {
      return { status: "error", error: resolved.error };
    }

    try {
      const dirents = await fs.readdir(resolved.absolutePath, { withFileTypes: true });
      const entries = dirents
        .map((dirent) => ({
          name: dirent.name,
          type: dirent.isDirectory() ? ("directory" as const) : ("file" as const),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { status: "ok", data: { path, entries } };
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "ENOENT") {
        return { status: "error", error: `Directory not found: ${path}` };
      }
      if (err instanceof Error && "code" in err && err.code === "ENOTDIR") {
        return { status: "error", error: `Path is not a directory: ${path}` };
      }
      return {
        status: "error",
        error: `Failed to read directory: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };
}

function createReadDirectoryTool(sandbox: Sandbox): Tool<ReadDirectoryArgs> {
  return {
    name: NAME,
    description: DESCRIPTION,
    schema,
    execute: createExecute(sandbox),
    requiresApproval: false,
  };
}

export default createReadDirectoryTool;
