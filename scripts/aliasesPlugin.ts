import { readFile } from "node:fs/promises";
import { join } from "node:path";
import stripJsonComments from "strip-json-comments"

async function loadTsconfig(
  tsconfigPath: string = join(process.cwd(), "tsconfig.json")
) {
  const text = stripJsonComments(await readFile(tsconfigPath, "utf-8"))
  return JSON.parse(text);
}

function removeWildcard(str: string): string {
  return str.replace(/\/\*$/, "");
}

export async function aliasesPlugin(
  tsconfigPath: string = join(process.cwd(), "tsconfig.json")
): Promise<Record<string, string>> {
  const tsconfig = await loadTsconfig(tsconfigPath);
  const paths = tsconfig.compilerOptions.paths;
  const aliases: Record<string, string> = Object.fromEntries(
    Object.entries<string[]>(paths).map(([k, v]): [string, string] => [
      removeWildcard(k),
      removeWildcard(v[0])
    ])
  )

  return aliases;
}
