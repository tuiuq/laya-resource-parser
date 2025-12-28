import type { Logger } from "./Logger";

export interface IFileProcessor {
  parseHierarchyFile(filePath: string, depth: number): Promise<void>;
  isParsable(path: string): boolean;
  isTopLevelHierarchy(path: string): boolean;
}

export interface IDownloadManager {
  downloadFile(filePath: string): Promise<Buffer>;
  isLocalFileExists(filePath: string): Promise<boolean>;
  getLocalFilePath(filePath: string): string;
}

export interface IPathResolver {
  resolveRemoteUrl(filePath: string): URL;
  resolveLocalPath(filePath: string): string;
  normalizePath(path: string): string;
}

export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  createChildLogger(prefix: string): Logger;
}

export interface IConfig {
  concurrency: number;
  topLevelHierarchyExtensions: string[];
  parsableHierarchyExtensions: string[];
  ignoredHierarchyExtensions: string[];
  filePathPattern: RegExp;
}
