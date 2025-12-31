/**
 * 核心类型定义
 */

import type { ResourceConfig } from './config';

/**
 * 资源管理器选项
 */
export interface ResourceManagerOptions {
  /** 基础路径 */
  base: string;
  /** 远程URL */
  remote: string;
  /** 并发数 */
  concurrency?: number;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 自定义配置 */
  config?: Partial<ResourceConfig>;
}

/**
 * 资源处理结果
 */
export interface ResourceProcessResult {
  /** 处理的文件总数 */
  totalFiles: number;
  /** 成功处理的文件数 */
  successFiles: number;
  /** 失败处理的文件数 */
  failedFiles: number;
  /** 所有文件列表 */
  fileList: string[];
  /** 顶层文件列表 */
  topLevelFiles: string[];
  /** 错误列表 */
  errors: Array<{
    filePath: string;
    error: Error;
  }>;
}

/**
 * 资源引用信息
 */
export interface ResourceReference {
  /** 引用路径 */
  path: string;
  /** 源文件路径 */
  sourcePath: string;
  /** 引用深度 */
  depth: number;
}

/**
 * 文件处理上下文
 */
export interface FileProcessingContext {
  /** 文件路径 */
  filePath: string;
  /** 处理深度 */
  depth: number;
  /** 父文件路径（如果有） */
  parentPath?: string;
  /** 处理开始时间 */
  startTime: Date;
  /** 处理状态 */
  status: 'pending' | 'processing' | 'success' | 'failed';
}

/**
 * 处理管道事件
 */
export interface PipelineEvent {
  /** 事件类型 */
  type: 'file_started' | 'file_completed' | 'file_failed' | 'download_started' | 'download_completed';
  /** 事件数据 */
  data: any;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 事件监听器
 */
export type EventListener = (event: PipelineEvent) => void;

/**
 * 资源管理器接口
 */
export interface IResourceManager {
  /**
   * 解析资源
   */
  parse(): Promise<ResourceProcessResult>;
  
  /**
   * 获取处理结果
   */
  getResult(): ResourceProcessResult;
  
  /**
   * 获取文件列表
   */
  getFileList(): string[];
  
  /**
   * 获取顶层文件列表
   */
  getTopLevelFiles(): string[];
  
  /**
   * 添加事件监听器
   */
  on(eventType: string, listener: EventListener): void;
  
  /**
   * 移除事件监听器
   */
  off(eventType: string, listener: EventListener): void;
}

/**
 * 处理管道接口
 */
export interface IPipeline {
  /**
   * 处理文件
   */
  processFile(filePath: string, context: FileProcessingContext): Promise<void>;
  
  /**
   * 批量处理文件
   */
  processFiles(filePaths: string[]): Promise<ResourceProcessResult>;
  
  /**
   * 添加中间件
   */
  use(middleware: PipelineMiddleware): void;
  
  /**
   * 清空中间件
   */
  clear(): void;
}

/**
 * 管道中间件
 */
export type PipelineMiddleware = (
  context: FileProcessingContext,
  next: () => Promise<void>
) => Promise<void>;

/**
 * 通用错误类
 */
export class ResourceParserError extends Error {
  public readonly code: string;
  public readonly filePath?: string;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    filePath?: string,
    cause?: Error
  ) {
    super(message);
    this.name = 'ResourceParserError';
    this.code = code;
    this.filePath = filePath;
    this.cause = cause;
  }
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 文件相关错误
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_PARSE_ERROR = 'FILE_PARSE_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  
  // 网络相关错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  URL_INVALID = 'URL_INVALID',
  
  // 配置相关错误
  CONFIG_ERROR = 'CONFIG_ERROR',
  CONFIG_VALIDATION_ERROR = 'CONFIG_VALIDATION_ERROR',
  
  // 处理相关错误
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MAX_DEPTH_EXCEEDED = 'MAX_DEPTH_EXCEEDED',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  
  // 系统相关错误
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  DISK_SPACE_ERROR = 'DISK_SPACE_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}