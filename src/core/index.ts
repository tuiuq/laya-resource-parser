/**
 * 核心模块导出
 */

// 资源管理器
export { ResourceManager } from './ResourceManager';
export type {
  ResourceManagerOptions,
  ResourceProcessResult,
  FileProcessingContext,
  PipelineEvent,
  EventListener,
  IResourceManager,
  ResourceParserError,
  ErrorCode
} from '../types/core';

// 配置管理器
export { ConfigManager } from '../config/ConfigManager';
export type {
  AppConfig,
  ResourceConfig,
  LoggerConfig,
  DownloaderConfig,
  ConfigLoadOptions,
  ConfigValidationResult
} from '../types/config';

// 日志器
export { Logger } from '../logger/Logger';
export type { LogEntry, LogFormatter, LogHandler } from '../logger/Logger';

// 处理器工厂
export { ProcessorFactory } from '../processors/ProcessorFactory';
export type {
  IFileProcessor,
  IProcessorFactory,
  ProcessorRegistration,
  FileProcessResult,
  FileMetadata,
  ProcessorMiddleware,
  ProcessorChain,
  ProcessorContext,
  ProcessorEvent,
  IObservableFileProcessor,
  BaseProcessorOptions,
  IProcessorLoader
} from '../types/processor';

// 下载管理器
export { DownloadManager } from '../downloaders/DownloadManager';
export type { IDownloadManager } from '../laya/interface';

// 路径解析器
export { PathResolver } from '../resolvers/PathResolver';
export type { IPathResolver } from '../laya/interface';

// 工具函数
export { walkFile } from '../utils/walkFile';
export { normalizePath } from '../utils/normalizePath';
export { looksLikeAssetPath } from '../utils/looksLikeAssetPath';
export { readArrayBuffer } from '../utils/readArrayBuffer';
export { readJSON } from '../utils/readJSON';
export { traverseData } from '../utils/traverseData';

// 类型导出
export type {
  Options,
  IFileConfig,
  IPkgMap,
  IBundleItem,
  IBundle
} from '../types';

// 常量导出
export {
  CONCURRENCY,
  TOP_LEVEL_HIERARCHY_EXTENSIONS,
  PARSABLE_HIERARCHY_EXTENSIONS,
  IGNORED_HIERARCHY_SUFFIXES,
  FILE_PATH_PATTERN
} from '../constants';

// 默认配置
export {
  DEFAULT_APP_CONFIG,
  DEFAULT_RESOURCE_CONFIG,
  DEFAULT_LOGGER_CONFIG,
  DEFAULT_DOWNLOADER_CONFIG,
  getDefaultConfig,
  mergeConfigs
} from '../config/defaults';

/**
 * 创建资源管理器实例
 */
export function createResourceManager(options: import('../types/core').ResourceManagerOptions): import('./ResourceManager').ResourceManager {
  return new (require('./ResourceManager').ResourceManager)(options);
}

/**
 * 创建配置管理器实例
 */
export function createConfigManager(options?: import('../types/config').ConfigLoadOptions): import('../config/ConfigManager').ConfigManager {
  return new (require('../config/ConfigManager').ConfigManager)(options);
}

/**
 * 创建日志器实例
 */
export function createLogger(name: string, config?: Partial<import('../types/config').LoggerConfig>): import('../logger/Logger').Logger {
  return new (require('../logger/Logger').Logger)(name, config);
}

/**
 * 版本信息
 */
export const VERSION = '1.0.0';

/**
 * 模块信息
 */
export const MODULE_INFO = {
  name: '@tuiuq/laya-resource-parser',
  version: VERSION,
  description: 'Laya资源解析器',
  author: 'tuiu <13719283454@163.com>',
  license: 'MIT'
};