/**
 * 类型定义模块导出
 */

// 核心类型
export * from './core';
export * from './config';
export * from './processor';

// 工具类型
export type {
  Options,
  IFileConfig,
  IPkgMap,
  IBundleItem,
  IBundle
} from '../types';

// 接口类型
export type {
  IFileProcessor as LegacyIFileProcessor,
  IDownloadManager as LegacyIDownloadManager,
  IPathResolver as LegacyIPathResolver,
  ILogger as LegacyILogger,
  IConfig as LegacyIConfig
} from '../laya/interface';

/**
 * 类型别名，用于向后兼容
 */
export type {
  ResourceManagerOptions as Options,
  ResourceConfig as IConfig,
  IFileProcessor,
  IResourceManager
} from './core';

/**
 * 常量重导出
 */
export {
  ErrorCode,
  LogLevel
} from './core';