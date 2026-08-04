import path from "node:path";

export type SafePathResult = { ok: true; absolutePath: string } | { ok: false; error: string };

export interface Sandbox {
  resolvePath: (relativePath: string) => SafePathResult;
}

function createResolvePath(workspace: string) {
  return (relativePath: string): SafePathResult => {
    if (path.isAbsolute(relativePath)) {
      return { ok: false, error: "Absolute paths are not allowed." };
    }

    const root = path.resolve(workspace);

    const absolutePath = path.resolve(root, relativePath);
    if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
      return { ok: false, error: "Could not resolve path inside sandbox. Out of project scope." };
    }

    return { ok: true, absolutePath };
  };
}

export default (workspace: string): Sandbox => {
  return {
    resolvePath: createResolvePath(workspace),
  };
};
