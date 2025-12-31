/**
 * 处理器工厂
 */

import type { AppConfig, ProcessorConfig } from '../types/config';
import type {
  IFileProcessor,
  IProcessorFactory,
  ProcessorRegistration,
  FileProcessingContext,
  FileProcessResult
} from '../types/processor';
import { Logger } from '../logger/Logger';
import { ResourceParserError, ErrorCode } from '../types/core';

/**
 * 处理器工厂实现
 */
export class ProcessorFactory implements IProcessorFactory {
  private readonly logger: Logger;
  private readonly processors: Map<string, ProcessorRegistration> = new Map();
  private readonly extensionMap: Map<string, string[]> = new Map();
  private readonly processorCache: Map<string, IFileProcessor> = new Map();

  constructor(config: AppConfig) {
    this.logger = new Logger('ProcessorFactory');
    this.initializeBuiltinProcessors();
    this.registerConfigProcessors(config);
  }

  /**
   * 初始化内置处理器
   */
  private initializeBuiltinProcessors(): void {
    // JSON处理器
    this.registerProcessor('json', {
      type: 'json',
      processorClass: JsonProcessor,
      supportedExtensions: ['.json', '.ls', '.lh', '.lmat', '.ltc'],
      priority: 100,
      description: 'JSON文件处理器'
    });

    // 二进制处理器
    this.registerProcessor('binary', {
      type: 'binary',
      processorClass: BinaryProcessor,
      supportedExtensions: ['.bin', '.dat', '.asset'],
      priority: 50,
      description: '二进制文件处理器'
    });

    // 文本处理器
    this.registerProcessor('text', {
      type: 'text',
      processorClass: TextProcessor,
      supportedExtensions: ['.txt', '.md', '.log'],
      priority: 10,
      description: '文本文件处理器'
    });

    this.logger.debug('内置处理器初始化完成', {
      processors: Array.from(this.processors.keys())
    });
  }

  /**
   * 注册配置中的处理器
   */
  private registerConfigProcessors(config: AppConfig): void {
    if (!config.processors || config.processors.length === 0) {
      return;
    }

    for (const processorConfig of config.processors) {
      try {
        this.registerProcessorFromConfig(processorConfig);
      } catch (error) {
        this.logger.error(`注册处理器失败: ${processorConfig.name}`, error);
      }
    }
  }

  /**
   * 从配置注册处理器
   */
  private registerProcessorFromConfig(config: ProcessorConfig): void {
    let processorClass: any;
    
    try {
      // 尝试加载处理器类
      if (config.processorClass.startsWith('.')) {
        // 相对路径
        const path = require('path');
        const fullPath = path.resolve(process.cwd(), config.processorClass);
        processorClass = require(fullPath);
      } else if (config.processorClass.includes('/')) {
        // 绝对路径或模块路径
        processorClass = require(config.processorClass);
      } else {
        // 内置处理器
        processorClass = this.getBuiltinProcessorClass(config.processorClass);
      }
    } catch (error) {
      throw new ResourceParserError(
        `加载处理器类失败: ${config.processorClass}`,
        ErrorCode.CONFIG_ERROR,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    // 验证处理器类
    if (typeof processorClass !== 'function') {
      throw new ResourceParserError(
        `处理器类必须是构造函数: ${config.processorClass}`,
        ErrorCode.CONFIG_ERROR
      );
    }

    // 注册处理器
    this.registerProcessor(config.name, {
      type: config.name,
      processorClass,
      supportedExtensions: config.supportedExtensions,
      options: config.options,
      priority: 50,
      description: `自定义处理器: ${config.name}`
    });

    this.logger.info(`注册自定义处理器: ${config.name}`, {
      extensions: config.supportedExtensions
    });
  }

  /**
   * 获取内置处理器类
   */
  private getBuiltinProcessorClass(className: string): any {
    const builtinClasses: Record<string, any> = {
      'json': JsonProcessor,
      'binary': BinaryProcessor,
      'text': TextProcessor
    };

    if (!builtinClasses[className]) {
      throw new ResourceParserError(
        `未知的内置处理器: ${className}`,
        ErrorCode.CONFIG_ERROR
      );
    }

    return builtinClasses[className];
  }

  /**
   * 创建处理器
   */
  public createProcessor(processorType: string, options?: Record<string, any>): IFileProcessor {
    const cacheKey = `${processorType}:${JSON.stringify(options || {})}`;
    
    // 检查缓存
    if (this.processorCache.has(cacheKey)) {
      return this.processorCache.get(cacheKey)!;
    }

    // 获取处理器注册信息
    const registration = this.processors.get(processorType);
    if (!registration) {
      throw new ResourceParserError(
        `未知的处理器类型: ${processorType}`,
        ErrorCode.CONFIG_ERROR
      );
    }

    // 创建处理器实例
    let processor: IFileProcessor;
    try {
      const ProcessorClass = registration.processorClass;
      const processorOptions = { ...registration.options, ...options };
      processor = new ProcessorClass(processorOptions);
    } catch (error) {
      throw new ResourceParserError(
        `创建处理器实例失败: ${processorType}`,
        ErrorCode.PROCESSING_ERROR,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    // 验证处理器接口
    this.validateProcessor(processor, processorType);

    // 缓存处理器
    this.processorCache.set(cacheKey, processor);
    
    this.logger.debug(`创建处理器: ${processorType}`, { options });
    
    return processor;
  }

  /**
   * 注册处理器
   */
  public registerProcessor(processorType: string, registration: ProcessorRegistration): void {
    // 验证注册信息
    this.validateRegistration(registration);

    // 注册处理器
    this.processors.set(processorType, registration);

    // 更新扩展映射
    for (const extension of registration.supportedExtensions) {
      if (!this.extensionMap.has(extension)) {
        this.extensionMap.set(extension, []);
      }
      const processors = this.extensionMap.get(extension)!;
      processors.push(processorType);
      
      // 按优先级排序
      processors.sort((a, b) => {
        const priorityA = this.processors.get(a)?.priority || 0;
        const priorityB = this.processors.get(b)?.priority || 0;
        return priorityB - priorityA; // 降序排列
      });
    }

    // 清空缓存
    this.processorCache.clear();

    this.logger.info(`注册处理器: ${processorType}`, {
      extensions: registration.supportedExtensions,
      priority: registration.priority
    });
  }

  /**
   * 注销处理器
   */
  public unregisterProcessor(processorType: string): void {
    const registration = this.processors.get(processorType);
    if (!registration) {
      return;
    }

    // 从扩展映射中移除
    for (const extension of registration.supportedExtensions) {
      const processors = this.extensionMap.get(extension);
      if (processors) {
        const index = processors.indexOf(processorType);
        if (index !== -1) {
          processors.splice(index, 1);
        }
        if (processors.length === 0) {
          this.extensionMap.delete(extension);
        }
      }
    }

    // 移除处理器
    this.processors.delete(processorType);

    // 清空缓存
    this.processorCache.clear();

    this.logger.info(`注销处理器: ${processorType}`);
  }

  /**
   * 获取所有已注册的处理器类型
   */
  public getRegisteredProcessors(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * 根据文件路径获取合适的处理器
   */
  public getProcessorForFile(filePath: string): IFileProcessor | null {
    // 获取文件扩展名
    const extension = this.getFileExtension(filePath);
    if (!extension) {
      return null;
    }

    // 查找支持该扩展名的处理器
    const processorTypes = this.extensionMap.get(extension);
    if (!processorTypes || processorTypes.length === 0) {
      return null;
    }

    // 使用优先级最高的处理器
    const processorType = processorTypes[0];
    return this.createProcessor(processorType);
  }

  /**
   * 获取所有支持指定扩展名的处理器
   */
  public getProcessorsForExtension(extension: string): IFileProcessor[] {
    const processorTypes = this.extensionMap.get(extension);
    if (!processorTypes) {
      return [];
    }

    return processorTypes.map(type => this.createProcessor(type));
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return '';
    }
    
    const extension = filePath.slice(lastDotIndex).toLowerCase();
    
    // 处理复合扩展名（如 .ltcb.ls）
    const secondLastDotIndex = filePath.lastIndexOf('.', lastDotIndex - 1);
    if (secondLastDotIndex !== -1) {
      const compoundExtension = filePath.slice(secondLastDotIndex).toLowerCase();
      // 检查是否为忽略的扩展名
      if (this.isIgnoredExtension(compoundExtension)) {
        return compoundExtension;
      }
    }
    
    return extension;
  }

  /**
   * 检查是否为忽略的扩展名
   */
  private isIgnoredExtension(extension: string): boolean {
    // 这里可以添加逻辑来检查是否为忽略的扩展名
    // 例如：['.ltcb.ls', '.lanit.ls']
    const ignoredExtensions = ['.ltcb.ls', '.lanit.ls'];
    return ignoredExtensions.includes(extension);
  }

  /**
   * 验证处理器注册信息
   */
  private validateRegistration(registration: ProcessorRegistration): void {
    if (!registration.type) {
      throw new ResourceParserError(
        '处理器类型不能为空',
        ErrorCode.CONFIG_ERROR
      );
    }

    if (!registration.processorClass) {
      throw new ResourceParserError(
        '处理器类不能为空',
        ErrorCode.CONFIG_ERROR
      );
    }

    if (!registration.supportedExtensions || registration.supportedExtensions.length === 0) {
      throw new ResourceParserError(
        '处理器必须支持至少一个文件扩展名',
        ErrorCode.CONFIG_ERROR
      );
    }

    // 验证扩展名格式
    for (const extension of registration.supportedExtensions) {
      if (!extension.startsWith('.')) {
        throw new ResourceParserError(
          `文件扩展名必须以点开头: ${extension}`,
          ErrorCode.CONFIG_ERROR
        );
      }
    }
  }

  /**
   * 验证处理器接口
   */
  private validateProcessor(processor: any, processorType: string): void {
    const requiredMethods = ['process', 'supports', 'getName', 'getSupportedExtensions'];
    
    for (const method of requiredMethods) {
      if (typeof processor[method] !== 'function') {
        throw new ResourceParserError(
          `处理器 ${processorType} 缺少必需的方法: ${method}`,
          ErrorCode.CONFIG_ERROR
        );
      }
    }
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.processorCache.clear();
    this.logger.debug('处理器缓存已清空');
  }

  /**
   * 获取处理器信息
   */
  public getProcessorInfo(processorType: string): ProcessorRegistration | undefined {
    return this.processors.get(processorType);
  }

  /**
   * 获取扩展名映射
   */
  public getExtensionMap(): Map<string, string[]> {
    return new Map(this.extensionMap);
  }
}

/**
 * JSON处理器
 */
class JsonProcessor implements IFileProcessor {
  constructor(private readonly options: Record<string, any> = {}) {}

  public async process(filePath: string, context: FileProcessingContext): Promise<FileProcessResult> {
    const startTime = Date.now();
    
    try {
      // 读取文件
      const { readFile } = await import('fs/promises');
      const content = await readFile(filePath, 'utf-8');
      
      // 解析JSON
      const data = JSON.parse(content);
      
      // 查找资源引用
      const references = this.findReferences(data, filePath);
      
      return {
        success: true,
        filePath,
        data,
        metadata: {
          fileType: 'json',
          extension: '.json',
          encoding: 'utf-8',
          fileSize: content.length
        },
        references,
        duration: Date.now() - startTime,
        fileSize: content.length
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      };
    }
  }

  public supports(filePath: string): boolean {
    return filePath.endsWith('.json') ||
           filePath.endsWith('.ls') ||
           filePath.endsWith('.lh') ||
           filePath.endsWith('.lmat') ||
           filePath.endsWith('.ltc');
  }

  public getName(): string {
    return 'JsonProcessor';
  }

  public getSupportedExtensions(): string[] {
    return ['.json', '.ls', '.lh', '.lmat', '.ltc'];
  }

  public getOptions(): Record<string, any> {
    return { ...this.options };
  }

  public setOptions(options: Record<string, any>): void {
    Object.assign(this.options, options);
  }

  /**
   * 查找资源引用
   */
  private findReferences(data: any, sourcePath: string): Array<{ path: string; sourcePath: string }> {
    const references: Array<{ path: string; sourcePath: string }> = [];
    
    function traverse(obj: any, path: string = ''): void {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            // 检查是否为资源路径
            if (this.isResourcePath(value)) {
              references.push({
                path: value,
                sourcePath
              });
            }
          } else if (typeof value === 'object' && value !== null) {
            traverse.call(this, value, currentPath);
          }
        }
      }
    }
    
    traverse.call(this, data);
    return references;
  }

  /**
   * 检查是否为资源路径
   */
  private isResourcePath(path: string): boolean {
    // 简单的资源路径检查
    return path.includes('.') && !path.startsWith('http') && !path.startsWith('//');
  }
}

/**
 * 二进制处理器
 */
class BinaryProcessor implements IFileProcessor {
  constructor(private readonly options: Record<string, any> = {}) {}

  public async process(filePath: string, context: FileProcessingContext): Promise<FileProcessResult> {
    const startTime = Date.now();
    
    try {
      // 读取文件
      const { readFile, stat } = await import('fs/promises');
      const buffer = await readFile(filePath);
      const stats = await stat(filePath);
      
      return {
        success: true,
        filePath,
        data: buffer,
        metadata: {
          fileType: 'binary',
          extension: this.getExtension(filePath),
          fileSize: buffer.length
        },
        duration: Date.now() - startTime,
        fileSize: buffer.length
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      };
    }
  }

  public supports(filePath: string): boolean {
    return filePath.endsWith('.bin') ||
           filePath.endsWith('.dat') ||
           filePath.endsWith('.asset');
  }

  public getName(): string {
    return 'BinaryProcessor';
  }

  public getSupportedExtensions(): string[] {
    return ['.bin', '.dat', '.asset'];
  }

  public getOptions(): Record<string, any> {
    return { ...this.options };
  }

  public setOptions(options: Record<string, any>): void {
    Object.assign(this.options, options);
  }

  private getExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filePath.slice(lastDotIndex);
  }
}

/**
 * 文本处理器
 */
class TextProcessor implements IFileProcessor {
  constructor(private readonly options: Record<string, any> = {}) {}

  public async process(filePath: string, context: FileProcessingContext): Promise<FileProcessResult> {
    const startTime = Date.now();
    
    try {
      // 读取文件
      const { readFile, stat } = await import('fs/promises');
      const content = await readFile(filePath, 'utf-8');
      const stats = await stat(filePath);
      
      return {
        success: true,
        filePath,
        data: content,
        metadata: {
          fileType: 'text',
          extension: this.getExtension(filePath),
          encoding: 'utf-8',
          fileSize: content.length
        },
        duration: Date.now() - startTime,
        fileSize: content.length
      };
    } catch (error) {
      return {
        success: false,
        filePath,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime
      };
    }
  }

  public supports(filePath: string): boolean {
    return filePath.endsWith('.txt') ||
           filePath.endsWith('.md') ||
           filePath.endsWith('.log');
  }

  public getName(): string {
    return 'TextProcessor';
  }

  public getSupportedExtensions(): string[] {
    return ['.txt', '.md', '.log'];
  }

  public getOptions(): Record<string, any> {
    return { ...this.options };
  }

  public setOptions(options: Record<string, any>): void {
    Object.assign(this.options, options);
  }

  private getExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filePath.slice(lastDotIndex);
  }
}