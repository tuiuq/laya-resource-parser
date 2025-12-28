import {
  CONCURRENCY,
  FILE_PATH_PATTERN,
  IGNORED_HIERARCHY_SUFFIXES,
  PARSABLE_HIERARCHY_EXTENSIONS,
  TOP_LEVEL_HIERARCHY_EXTENSIONS
} from "@/constants";
import type { IConfig } from "./interface";

export class ConfigManager implements IConfig {
  public readonly concurrency: number;
  public readonly topLevelHierarchyExtensions: string[];
  public readonly parsableHierarchyExtensions: string[];
  public readonly ignoredHierarchyExtensions: string[];
  public readonly filePathPattern: RegExp;

  constructor(config?: Partial<IConfig>) {
    this.concurrency = config?.concurrency ?? CONCURRENCY;
    this.topLevelHierarchyExtensions = config?.topLevelHierarchyExtensions ?? TOP_LEVEL_HIERARCHY_EXTENSIONS;
    this.parsableHierarchyExtensions = config?.parsableHierarchyExtensions ?? PARSABLE_HIERARCHY_EXTENSIONS;
    this.ignoredHierarchyExtensions = config?.ignoredHierarchyExtensions ?? IGNORED_HIERARCHY_SUFFIXES;
    this.filePathPattern = config?.filePathPattern ?? FILE_PATH_PATTERN;
  }
}
