import { readFile } from "node:fs/promises";

export async function readJSON<T>(filePath: string): Promise<T> {
  try {
    const content  = await readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${filePath}`, {
      cause: error
    });
  }
}
