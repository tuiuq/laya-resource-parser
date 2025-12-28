import { join } from "node:path";
import type { IPathResolver } from "./interface";

export class PathResolver implements IPathResolver {
  constructor(
    private readonly basePath: string,
    private readonly remoteUrl: URL
  ) {}

  public resolveRemoteUrl(filePath: string): URL {
    return new URL(filePath, this.remoteUrl);
  }

  public resolveLocalPath(filePath: string): string {
    return join(this.basePath, this.normalizePath(filePath));
  }

  public normalizePath(path: string): string {
    return path.replace(/\s/g, "_")
  }

  public endsWithAny(path: string, suffixes: string[]): boolean {
    for (const suffix of suffixes) {
      if (path.endsWith(suffix)) return true;
    }
    return false;
  }
}
