import { readFile } from "node:fs/promises";

export async function readArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  try {
    const content = await readFile(filePath);
    return content.buffer as ArrayBuffer;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    throw error;
  }
}
