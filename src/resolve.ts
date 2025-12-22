import { join, resolve } from "node:path";

export interface ParseOptions {
  base: string;
  remote?: string;
}

export function resolveParseOptions(raw: {
  base?: string,
  remote?: string
}): ParseOptions {
  return {
    base: resolve(raw.base ?? join(process.cwd(), "src")),
    remote: raw.remote
  } as ParseOptions;
}
