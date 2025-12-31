/**
 * Laya资源解析器 - 主入口文件
 * 
 * 提供模块化的API接口和CLI工具
 */

// 核心模块导出
export * from './core';

// CLI工具
export { main as cli } from './cli/index';

// 类型导出
export * from './types';

// 工具函数导出
export { walkFile } from './utils/walkFile';
export { normalizePath } from './utils/normalizePath';
export { looksLikeAssetPath } from './utils/looksLikeAssetPath';
export { readArrayBuffer } from './utils/readArrayBuffer';
export { readJSON } from './utils/readJSON';
export { traverseData } from './utils/traverseData';

// 常量导出
export {
  CONCURRENCY,
  TOP_LEVEL_HIERARCHY_EXTENSIONS,
  PARSABLE_HIERARCHY_EXTENSIONS,
  IGNORED_HIERARCHY_SUFFIXES,
  FILE_PATH_PATTERN,
  ROOT,
  PKG_MAP_PATH,
  BUNDLE_PATH,
  FILECONFIG_PATH
} from './constants';

// 向后兼容的旧接口
export { ResourceManager as LegacyResourceManager } from './laya/ResourceManager';
export { ConfigManager as LegacyConfigManager } from './laya/ConfigManager';
export { DownloadManager as LegacyDownloadManager } from './laya/DownloadManager';
export { FileProcessor as LegacyFileProcessor } from './laya/FileProcessor';
export { Logger as LegacyLogger, LogLevel as LegacyLogLevel } from './laya/Logger';
export { PathResolver as LegacyPathResolver } from './laya/PathResolver';

/**
 * 默认导出 - 创建资源管理器
 */
export default {
  /**
   * 创建资源管理器实例
   */
  createResourceManager: (options: import('./types/core').ResourceManagerOptions) => {
    const { createResourceManager } = require('./core');
    return createResourceManager(options);
  },

  /**
   * 创建配置管理器实例
   */
  createConfigManager: (options?: import('./types/config').ConfigLoadOptions) => {
    const { createConfigManager } = require('./core');
    return createConfigManager(options);
  },

  /**
   * 创建日志器实例
   */
  createLogger: (name: string, config?: Partial<import('./types/config').LoggerConfig>) => {
    const { createLogger } = require('./core');
    return createLogger(name, config);
  },

  /**
   * 版本信息
   */
  VERSION: '1.0.0',

  /**
   * 模块信息
   */
  MODULE_INFO: {
    name: '@tuiuq/laya-resource-parser',
    version: '1.0.0',
    description: 'Laya资源解析器',
    author: 'tuiu <13719283454@163.com>',
    license: 'MIT'
  }
};

/**
 * CLI入口点
 * 
 * 当通过命令行直接调用时执行
 */
if (require.main === module) {
  const { cli } = require('./cli/index');
  cli().catch((error: Error) => {
    console.error('CLI执行失败:', error.message);
    process.exit(1);
  });
}