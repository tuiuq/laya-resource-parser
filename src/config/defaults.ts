/**
 * 默认配置
 */

import type { AppConfig, ResourceConfig, LoggerConfig, DownloaderConfig } from '../types/config';

/**
 * 默认资源解析配置
 */
export const DEFAULT_RESOURCE_CONFIG: ResourceConfig = {
  concurrency: 5,
  topLevelHierarchyExtensions: ['.ls', '.lh'],
  parsableHierarchyExtensions: ['.ls', '.lh', '.lmat', '.ltc'],
  ignoredHierarchyExtensions: ['.ltcb.ls', '.lanit.ls'],
  filePathPattern: /^[\w./-\s-]*\.[A-Za-z0-9]{2,5}(\.[A-Za-z0-9]{2,5})?$/i,
  maxDepth: 10,
  timeout: 30000,
  enableCache: true,
  cacheDir: '.laya-cache',
  retryCount: 3,
  retryDelay: 1000,
  skipProcessedFiles: true,
  validateFileIntegrity: false
};

/**
 * 默认日志配置
 */
export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  enableColors: true,
  enableFileLogging: false,
  logFile: 'laya-parser.log',
  format: '[{timestamp}] [{level}] {message}',
  showTimestamp: true,
  showLevel: true,
  showCaller: false
};

/**
 * 默认下载器配置
 */
export const DEFAULT_DOWNLOADER_CONFIG: DownloaderConfig = {
  userAgent: 'LayaResourceParser/1.0.0',
  timeout: 15000,
  maxRetries: 3,
  retryDelay: 1000,
  enableCompression: true,
  headers: {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache'
  }
};

/**
 * 默认应用配置
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  resource: DEFAULT_RESOURCE_CONFIG,
  logger: DEFAULT_LOGGER_CONFIG,
  downloader: DEFAULT_DOWNLOADER_CONFIG,
  processors: [],
  resolvers: [],
  plugins: [],
  extensions: {}
};

/**
 * 环境特定的配置
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    resource: {
      concurrency: 3,
      enableCache: false,
      validateFileIntegrity: true
    },
    logger: {
      level: 'debug',
      enableFileLogging: true,
      showCaller: true
    }
  },
  production: {
    resource: {
      concurrency: 10,
      enableCache: true,
      retryCount: 5
    },
    logger: {
      level: 'warn',
      enableFileLogging: true
    }
  },
  test: {
    resource: {
      concurrency: 1,
      enableCache: false,
      skipProcessedFiles: false
    },
    logger: {
      level: 'silent',
      enableColors: false
    }
  }
};

/**
 * 获取环境特定的配置
 */
export function getEnvironmentConfig(env: string = process.env.NODE_ENV || 'development'): Partial<AppConfig> {
  const envKey = env.toLowerCase();
  return ENVIRONMENT_CONFIGS[envKey as keyof typeof ENVIRONMENT_CONFIGS] || ENVIRONMENT_CONFIGS.development;
}

/**
 * 合并配置
 */
export function mergeConfigs<T>(defaultConfig: T, overrideConfig: Partial<T>): T {
  return {
    ...defaultConfig,
    ...overrideConfig,
    resource: {
      ...defaultConfig['resource' as keyof T],
      ...overrideConfig['resource' as keyof T]
    },
    logger: {
      ...defaultConfig['logger' as keyof T],
      ...overrideConfig['logger' as keyof T]
    },
    downloader: {
      ...defaultConfig['downloader' as keyof T],
      ...overrideConfig['downloader' as keyof T]
    }
  } as T;
}

/**
 * 获取完整的默认配置
 */
export function getDefaultConfig(env?: string): AppConfig {
  const envConfig = getEnvironmentConfig(env);
  return mergeConfigs(DEFAULT_APP_CONFIG, envConfig);
}