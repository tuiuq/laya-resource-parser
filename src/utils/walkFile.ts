import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { normalizePath } from "./normalizePath";
import type { WalkFileOptions } from "./types";

export async function walkFile(
  base: string,
  options: WalkFileOptions = {}
): Promise<string[]> {
  const {
    root = base,
    filter = () => true,
    ignoreDir = () => false
  } = options;
  const results: string[] = [];
  const entries = await readdir(base, { withFileTypes: true });

  for (const entry of entries) {
    const absPath = join(base, entry.name);

    if (entry.isDirectory()) {
      if (options.ignoreDir?.(entry.name, absPath)) {
        continue;
      }

      const sub = await walkFile(absPath, {
        root,
        filter,
        ignoreDir
      });
      results.push(...sub);
      continue;
    }

    if (entry.isFile()) {
      const rel = normalizePath(relative(options.root as string, absPath))

      if (!options.filter || await options.filter(rel)) {
        results.push(rel);
      }
    }
  }

  return results;
}
