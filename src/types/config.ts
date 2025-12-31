/**
 * 配置类型定义
 */

/**
 * 资源解析配置
 */
export interface ResourceConfig {
  /** 并发处理数 */
  concurrency: number;
  /** 顶层文件扩展名 */
  topLevelHierarchyExtensions: string[];
  /** 可解析的文件扩展名 */
  parsableHierarchyExtensions: string[];
  /** 忽略的文件扩展名 */
  ignoredHierarchyExtensions: string[];
  /** 文件路径模式正则表达式 */
  filePathPattern: RegExp;
  /** 最大递归深度 */
  maxDepth?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存目录 */
  cacheDir?: string;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否跳过已处理的文件 */
  skipProcessedFiles?: boolean;
  /** 是否验证文件完整性 */
  validateFileIntegrity?: boolean;
  /** 自定义处理器映射 */
  processorMap?: Record<string, string>;
  /** 自定义下载器配置 */
  downloaderConfig?: DownloaderConfig;
}

/**
 * 下载器配置
 */
export interface DownloaderConfig {
  /** 用户代理 */
  userAgent?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 代理配置 */
  proxy?: ProxyConfig;
}

/**
 * 代理配置
 */
export interface ProxyConfig {
  /** 代理URL */
  url: string;
  /** 代理用户名 */
  username?: string;
  /** 代理密码 */
  password?: string;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /** 日志级别 */
  level: LogLevel;
  /** 是否启用颜色 */
  enableColors?: boolean;
  /** 是否输出到文件 */
  enableFileLogging?: boolean;
  /** 日志文件路径 */
  logFile?: string;
  /** 日志格式 */
  format?: string;
  /** 是否显示时间戳 */
  showTimestamp?: boolean;
  /** 是否显示日志级别 */
  showLevel?: boolean;
  /** 是否显示调用者信息 */
  showCaller?: boolean;
}

/**
 * 日志级别
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
  SILENT = 'silent'
}

/**
 * 处理器配置
 */
export interface ProcessorConfig {
  /** 处理器名称 */
  name: string;
  /** 支持的文件扩展名 */
  supportedExtensions: string[];
  /** 处理器类名或路径 */
  processorClass: string;
  /** 处理器选项 */
  options?: Record<string, any>;
}

/**
 * 解析器配置
 */
export interface ResolverConfig {
  /** 解析器类型 */
  type: 'path' | 'url' | 'custom';
  /** 解析器类名或路径 */
  resolverClass: string;
  /** 解析器选项 */
  options?: Record<string, any>;
}

/**
 * 完整应用配置
 */
export interface AppConfig {
  /** 资源解析配置 */
  resource: ResourceConfig;
  /** 日志配置 */
  logger?: LoggerConfig;
  /** 处理器配置列表 */
  processors?: ProcessorConfig[];
  /** 解析器配置列表 */
  resolvers?: ResolverConfig[];
  /** 下载器配置 */
  downloader?: DownloaderConfig;
  /** 插件配置 */
  plugins?: PluginConfig[];
  /** 自定义扩展 */
  extensions?: Record<string, any>;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  /** 插件名称 */
  name: string;
  /** 插件路径或包名 */
  plugin: string;
  /** 插件选项 */
  options?: Record<string, any>;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors?: string[];
  /** 警告信息 */
  warnings?: string[];
}

/**
 * 配置加载选项
 */
export interface ConfigLoadOptions {
  /** 配置文件路径 */
  configPath?: string;
  /** 是否合并默认配置 */
  mergeDefaults?: boolean;
  /** 是否验证配置 */
  validate?: boolean;
  /** 环境变量前缀 */
  envPrefix?: string;
  /** 命令行参数 */
  cliArgs?: Record<string, any>;
}