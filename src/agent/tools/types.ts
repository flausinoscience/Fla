export type ToolResult =
  | { status: "ok"; data: unknown }
  | { status: "error"; error: string }
  | { status: "rejected"; reason: string };

export type ToolValidationResult<T> =
  { success: true; data: T } | { success: false; reason: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParametersSchema = Record<string, any>;

export type ToolSchema<T> = {
  parameters: ParametersSchema;
  validate: (arg: unknown) => ToolValidationResult<T>;
};

export type Tool<Arg = Record<string, unknown>> = {
  name: string;
  description: string;
  schema: ToolSchema<Arg>;
  execute: (arg: Arg) => Promise<ToolResult>;
  requiresApproval: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTool = Tool<any>;
export type ToolRegistry = Map<string, AnyTool>;

export type ToolRegistryParams = {
  workspaceRoot: string;
};
