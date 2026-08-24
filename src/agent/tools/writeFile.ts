import fs from "fs/promises";
import path from "node:path";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import type { Tool, ToolResult, ToolSchema, ToolValidationResult } from "./types.js";
import type { Sandbox } from "../sandbox.js";

const NAME = "write_file";

const MAX_BYTES = 1_000_000; // 1MB cap to keep subsequent read_file calls within reason

const DESCRIPTION = `
Create or overwrite a single file inside the workspace. The path must be
relative to the workspace root (e.g. 'src/agent/loop.ts' or 'README.md') —
do not use absolute paths or '..' segments. If the parent directory does
not exist, it will be created. This tool always overwrites the file at
the given path with no merge or diff step: if you need to preserve any
existing contents, read the file first and pass the full desired content
back. The content is treated as UTF-8 text; binary files are not supported.
Contents larger than ${MAX_BYTES} bytes are rejected.`;

const writeFileParams = z.object({
  path: z
    .string()
    .describe("Relative path to the file from the workspace root, e.g. 'src/agent/loop.ts'"),
  content: z.string().describe("Full UTF-8 text content to write to the file"),
});

type WriteFileArgs = z.infer<typeof writeFileParams>;

function validate(args: unknown): ToolValidationResult<WriteFileArgs> {
  const results = writeFileParams.safeParse(args);
  if (!results.success) {
    return { success: false, reason: fromZodError(results.error).message };
  }
  return { success: true, data: results.data };
}

const schema: ToolSchema<WriteFileArgs> = {
  parameters: z.toJSONSchema(writeFileParams),
  validate,
};

function createExecute(sandbox: Sandbox) {
  return async function execute({ path: filePath, content }: WriteFileArgs): Promise<ToolResult> {
    if (Buffer.byteLength(content, "utf-8") > MAX_BYTES) {
      return {
        status: "error",
        error: `Content too large; write_file is capped at ${MAX_BYTES} bytes.`,
      };
    }

    const resolved = sandbox.resolvePath(filePath);
    if (!resolved.ok) {
      return { status: "error", error: resolved.error };
    }

    const parentDir = path.dirname(resolved.absolutePath);
    try {
      await fs.mkdir(parentDir, { recursive: true });
    } catch (err) {
      return {
        status: "error",
        error: `Failed to create parent directory: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    try {
      await fs.writeFile(resolved.absolutePath, content, "utf-8");
      return {
        status: "ok",
        data: {
          path: filePath,
          bytesWritten: Buffer.byteLength(content, "utf-8"),
        },
      };
    } catch (err) {
      if (err instanceof Error && "code" in err && err.code === "EISDIR") {
        return { status: "error", error: `Path is a directory, not a file: ${filePath}` };
      }
      if (
        err instanceof Error &&
        "code" in err &&
        (err.code === "EACCES" || err.code === "EPERM")
      ) {
        return { status: "error", error: `Permission denied: ${filePath}` };
      }
      return {
        status: "error",
        error: `Failed to write file: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };
}

function createWriteFileTool(sandbox: Sandbox): Tool<WriteFileArgs> {
  return {
    name: NAME,
    description: DESCRIPTION,
    schema,
    execute: createExecute(sandbox),
    requiresApproval: true,
  };
}

export default createWriteFileTool;
