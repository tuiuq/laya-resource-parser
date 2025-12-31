/**
 * 向后兼容的ConfigManager
 * 
 * 注意：这个类是为了保持向后兼容性而保留的
 * 新的代码应该使用 src/config/ConfigManager.ts
 */

import type { IConfig } from './interface';
import {
  CONCURRENCY,
  FILE_PATH_PATTERN,
  IGNORED_HIERARCHY_SUFFIXES,
  PARSABLE_HIERARCHY_EXTENSIONS,
  TOP_LEVEL_HIERARCHY_EXTENSIONS
} from '../constants';

/**
 * @deprecated 使用新的 ConfigManager (从 src/config 导入)
 */
export class ConfigManager implements IConfig {
  public readonly concurrency: number;
  public readonly topLevelHierarchyExtensions: string[];
  public readonly parsableHierarchyExtensions: string[];
  public readonly ignoredHierarchyExtensions: string[];
  public readonly filePathPattern: RegExp;

  constructor(config?: Partial<IConfig>) {
    console.warn('警告: 使用已弃用的ConfigManager，请迁移到新的ConfigManager (从 src/config 导入)');
    
    this.concurrency = config?.concurrency ?? CONCURRENCY;
    this.topLevelHierarchyExtensions = config?.topLevelHierarchyExtensions ?? TOP_LEVEL_HIERARCHY_EXTENSIONS;
    this.parsableHierarchyExtensions = config?.parsableHierarchyExtensions ?? PARSABLE_HIERARCHY_EXTENSIONS;
    this.ignoredHierarchyExtensions = config?.ignoredHierarchyExtensions ?? IGNORED_HIERARCHY_SUFFIXES;
    this.filePathPattern = config?.filePathPattern ?? FILE_PATH_PATTERN;
  }

  /**
   * 获取配置值
   */
  public get<K extends keyof IConfig>(key: K): IConfig[K] {
    return this[key];
  }

  /**
   * 设置配置值
   */
  public set<K extends keyof IConfig>(key: K, value: IConfig[K]): void {
    console.warn('警告: ConfigManager.set() 方法已弃用，配置是只读的');
    // 在实际实现中，这里应该更新配置
    (this as any)[key] = value;
  }

  /**
   * 合并配置
   */
  public merge(config: Partial<IConfig>): ConfigManager {
    console.warn('警告: ConfigManager.merge() 方法已弃用');
    return new ConfigManager({
      concurrency: config.concurrency ?? this.concurrency,
      topLevelHierarchyExtensions: config.topLevelHierarchyExtensions ?? this.topLevelHierarchyExtensions,
      parsableHierarchyExtensions: config.parsableHierarchyExtensions ?? this.parsableHierarchyExtensions,
      ignoredHierarchyExtensions: config.ignoredHierarchyExtensions ?? this.ignoredHierarchyExtensions,
      filePathPattern: config.filePathPattern ?? this.filePathPattern
    });
  }

  /**
   * 转换为JSON
   */
  public toJSON(): IConfig {
    return {
      concurrency: this.concurrency,
      topLevelHierarchyExtensions: this.topLevelHierarchyExtensions,
      parsableHierarchyExtensions: this.parsableHierarchyExtensions,
      ignoredHierarchyExtensions: this.ignoredHierarchyExtensions,
      filePathPattern: this.filePathPattern
    };
  }

  /**
   * 从JSON创建ConfigManager
   */
  public static fromJSON(json: IConfig): ConfigManager {
    console.warn('警告: ConfigManager.fromJSON() 方法已弃用');
    return new ConfigManager(json);
  }

  /**
   * 获取默认配置
   */
  public static getDefaultConfig(): IConfig {
    console.warn('警告: ConfigManager.getDefaultConfig() 方法已弃用');
    return {
      concurrency: CONCURRENCY,
      topLevelHierarchyExtensions: TOP_LEVEL_HIERARCHY_EXTENSIONS,
      parsableHierarchyExtensions: PARSABLE_HIERARCHY_EXTENSIONS,
      ignoredHierarchyExtensions: IGNORED_HIERARCHY_SUFFIXES,
      filePathPattern: FILE_PATH_PATTERN
    };
  }
}