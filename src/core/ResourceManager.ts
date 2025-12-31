/**
 * 核心资源管理器
 */

// join is not used in this file
import pLimit from 'p-limit';
import type {
  ResourceManagerOptions,
  ResourceProcessResult,
  FileProcessingContext,
  PipelineEvent,
  EventListener,
  IResourceManager,
  ResourceParserError,
  ErrorCode
} from '../types/core';
import type { ResourceConfig } from '../types/config';
// IFileProcessor and FileProcessResult are not used in this file
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../logger/Logger';
import { ProcessorFactory } from '../processors/ProcessorFactory';
import { DownloadManager } from '../downloaders/DownloadManager';
import { PathResolver } from '../resolvers/PathResolver';

/**
 * 资源管理器实现
 */
export class ResourceManager implements IResourceManager {
  private readonly config: ResourceConfig;
  private readonly logger: Logger;
  private readonly processorFactory: ProcessorFactory;
  private readonly downloadManager: DownloadManager;
  private readonly pathResolver: PathResolver;
  
  private readonly eventListeners: Map<string, EventListener[]> = new Map();
  private readonly processedFiles: Set<string> = new Set();
  private readonly processingContexts: Map<string, FileProcessingContext> = new Map();
  private readonly result: ResourceProcessResult = {
    totalFiles: 0,
    successFiles: 0,
    failedFiles: 0,
    fileList: [],
    topLevelFiles: [],
    errors: []
  };
  
  private isProcessing: boolean = false;
  private abortController?: AbortController;

  constructor(options: ResourceManagerOptions) {
    // 加载配置
    const configManager = new ConfigManager({
      cliArgs: options,
      mergeDefaults: true,
      validate: true
    });
    
    const appConfig = configManager.getConfig();
    this.config = appConfig.resource;
    
    // 初始化日志器
    this.logger = new Logger('ResourceManager', appConfig.logger);
    
    // 初始化组件
    this.processorFactory = new ProcessorFactory(appConfig);
    this.downloadManager = new DownloadManager(appConfig.downloader || {}, this.logger);
    this.pathResolver = new PathResolver(options.base, new URL(options.remote));
    
    this.logger.info('资源管理器初始化完成', {
      base: options.base,
      remote: options.remote,
      concurrency: this.config.concurrency
    });
  }

  /**
   * 解析资源
   */
  public async parse(): Promise<ResourceProcessResult> {
    if (this.isProcessing) {
      throw new Error(
        '资源解析正在进行中',
        'PROCESSING_ERROR'
      );
    }

    try {
      this.isProcessing = true;
      this.abortController = new AbortController();
      
      this.logger.info('开始资源解析');
      this.emitEvent('start', { timestamp: new Date() });

      // 收集顶层文件
      await this.collectTopLevelFiles();
      
      // 处理文件
      await this.processFiles();
      
      this.logger.info('资源解析完成', this.result);
      this.emitEvent('complete', this.result);
      
      return this.getResult();
    } catch (error) {
      this.logger.error('资源解析失败', error);
      this.emitEvent('error', { error });
      throw error;
    } finally {
      this.isProcessing = false;
      this.abortController = undefined;
    }
  }

  /**
   * 收集顶层文件
   */
  private async collectTopLevelFiles(): Promise<void> {
    this.logger.info('开始收集顶层文件', { base: this.pathResolver.getBasePath() });
    
    const files = await this.walkDirectory(this.pathResolver.getBasePath());
    const topLevelFiles = files.filter(file => this.isTopLevelFile(file));
    
    this.result.topLevelFiles = topLevelFiles;
    this.result.totalFiles = topLevelFiles.length;
    
    this.logger.info('顶层文件收集完成', {
      totalFiles: topLevelFiles.length,
      files: topLevelFiles
    });
    
    this.emitEvent('top_level_collected', { files: topLevelFiles });
  }

  /**
   * 处理文件
   */
  private async processFiles(): Promise<void> {
    const limit = pLimit(this.config.concurrency);
    const tasks = this.result.topLevelFiles.map(filePath =>
      limit(async () => {
        if (this.abortController?.signal.aborted) {
          return;
        }

        try {
          await this.processFile(filePath, 0);
          this.result.successFiles++;
        } catch (error) {
          this.result.failedFiles++;
          this.result.errors.push({
            filePath,
            error: error instanceof Error ? error : new Error(String(error))
          });
          this.logger.error(`文件处理失败: ${filePath}`, error);
          this.emitEvent('file_failed', { filePath, error });
        }
      })
    );

    await Promise.all(tasks);
  }

  /**
   * 处理单个文件
   */
  private async processFile(filePath: string, depth: number): Promise<void> {
    // 检查最大深度
    if (this.config.maxDepth !== undefined && depth > this.config.maxDepth) {
      throw new Error(
        `超过最大递归深度: ${depth} > ${this.config.maxDepth}`,
        'MAX_DEPTH_EXCEEDED',
        filePath
      );
    }

    // 检查是否已处理
    if (this.config.skipProcessedFiles && this.processedFiles.has(filePath)) {
      this.logger.debug(`跳过已处理文件: ${filePath}`);
      return;
    }

    // 创建处理上下文
    const context: FileProcessingContext = {
      filePath,
      depth,
      startTime: new Date(),
      status: 'processing'
    };
    
    this.processingContexts.set(filePath, context);
    this.processedFiles.add(filePath);
    this.result.fileList.push(filePath);
    
    this.logger.info(`开始处理文件 [深度 ${depth}]: ${filePath}`);
    this.emitEvent('file_started', context);

    try {
      // 下载文件（如果需要）
      await this.downloadManager.downloadIfNeeded(filePath);
      
      // 获取合适的处理器
      const processor = this.processorFactory.getProcessorForFile(filePath);
      if (!processor) {
        this.logger.warn(`没有找到合适的处理器: ${filePath}`);
        context.status = 'success';
        return;
      }

      // 处理文件
      const processResult = await processor.process(filePath, context);
      
      if (processResult.success) {
        context.status = 'success';
        this.logger.info(`文件处理成功: ${filePath}`, {
          duration: processResult.duration,
          references: processResult.references?.length || 0
        });
        
        // 递归处理引用
        if (processResult.references) {
          await this.processReferences(processResult.references, depth + 1);
        }
        
        this.emitEvent('file_completed', { context, result: processResult });
      } else {
        throw processResult.error || new Error('文件处理失败');
      }
    } catch (error) {
      context.status = 'failed';
      throw error;
    }
  }

  /**
   * 处理引用文件
   */
  private async processReferences(
    references: Array<{ path: string; sourcePath: string }>,
    depth: number
  ): Promise<void> {
    const limit = pLimit(this.config.concurrency);
    const tasks = references.map(ref =>
      limit(async () => {
        try {
          await this.processFile(ref.path, depth);
        } catch (error) {
          this.logger.error(`引用文件处理失败: ${ref.path}`, {
            source: ref.sourcePath,
            error
          });
        }
      })
    );

    await Promise.all(tasks);
  }

  /**
   * 遍历目录
   */
  private async walkDirectory(dirPath: string): Promise<string[]> {
    const { readdir } = await import('fs/promises');
    const { join, relative } = await import('path');
    
    const files: string[] = [];
    
    const walk = async (currentPath: string): Promise<void> => {
      const entries = await readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const relPath = relative(this.pathResolver.getBasePath(), fullPath);
          files.push(relPath);
        }
      }
    }
    
    await walk.call(this, dirPath);
    return files;
  }

  /**
   * 检查是否为顶层文件
   */
  private isTopLevelFile(filePath: string): boolean {
    for (const extension of this.config.topLevelHierarchyExtensions) {
      if (filePath.endsWith(extension)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取处理结果
   */
  public getResult(): ResourceProcessResult {
    return { ...this.result };
  }

  /**
   * 获取文件列表
   */
  public getFileList(): string[] {
    return [...this.result.fileList];
  }

  /**
   * 获取顶层文件列表
   */
  public getTopLevelFiles(): string[] {
    return [...this.result.topLevelFiles];
  }

  /**
   * 添加事件监听器
   */
  public on(eventType: string, listener: EventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  public off(eventType: string, listener: EventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(eventType: string, data: any): void {
    const event: PipelineEvent = {
      type: eventType,
      data,
      timestamp: new Date()
    };

    const listeners = this.eventListeners.get(eventType) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        this.logger.error('事件监听器执行失败', { eventType, error });
      }
    }

    // 总是触发通用事件
    if (eventType !== '*') {
      this.emitEvent('all', event);
    }
  }

  /**
   * 中止处理
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.logger.info('资源解析已中止');
      this.emitEvent('aborted', { timestamp: new Date() });
    }
  }

  /**
   * 重置状态
   */
  public reset(): void {
    this.processedFiles.clear();
    this.processingContexts.clear();
    this.result.totalFiles = 0;
    this.result.successFiles = 0;
    this.result.failedFiles = 0;
    this.result.fileList = [];
    this.result.topLevelFiles = [];
    this.result.errors = [];
    this.isProcessing = false;
    
    this.logger.info('资源管理器状态已重置');
  }

  /**
   * 获取处理状态
   */
  public getStatus(): {
    isProcessing: boolean;
    processedCount: number;
    totalCount: number;
    successCount: number;
    failedCount: number;
  } {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedFiles.size,
      totalCount: this.result.totalFiles,
      successCount: this.result.successFiles,
      failedCount: this.result.failedFiles
    };
  }

  /**
   * 获取处理中的文件上下文
   */
  public getProcessingContexts(): FileProcessingContext[] {
    return Array.from(this.processingContexts.values());
  }

  /**
   * 获取处理进度
   */
  public getProgress(): number {
    if (this.result.totalFiles === 0) {
      return 0;
    }
    return (this.processedFiles.size / this.result.totalFiles) * 100;
  }
}