/**
 * 向后兼容的ResourceManager
 * 
 * 注意：这个类是为了保持向后兼容性而保留的
 * 新的代码应该使用 src/core/ResourceManager.ts
 */

import { createResourceManager as createNewResourceManager } from '../core';
import type { ResourceManagerOptions } from '../types/core';
import type { IConfig, ILogger } from './interface';

/**
 * @deprecated 使用新的 ResourceManager (从 src/core 导入)
 */
export class ResourceManager {
  private readonly newResourceManager: any;

  constructor(
    base: string,
    config: IConfig,
    logger: ILogger,
    _fileProcessor?: any
  ) {
    // 将旧配置转换为新配置
    const options: ResourceManagerOptions = {
      base,
      remote: '', // 需要从其他地方获取
      concurrency: config.concurrency,
      debug: (logger as any).getLevel?.() === 'debug',
      config: {
        concurrency: config.concurrency,
        topLevelHierarchyExtensions: config.topLevelHierarchyExtensions,
        parsableHierarchyExtensions: config.parsableHierarchyExtensions,
        ignoredHierarchyExtensions: config.ignoredHierarchyExtensions,
        filePathPattern: config.filePathPattern
      }
    };

    this.newResourceManager = createNewResourceManager(options);
  }

  /**
   * 解析所有资源文件
   */
  public async parse(): Promise<void> {
    console.warn('警告: 使用已弃用的ResourceManager，请迁移到新的ResourceManager (从 src/core 导入)');
    
    try {
      const result = await this.newResourceManager.parse();
      
      // 模拟旧的日志输出
      console.log(`\n解析完成, 共处理 ${result.fileList.length} 个文件`);
      console.log("文件列表: ");
      result.fileList.sort().forEach((file: string) => console.log(`  - ${file}`));
    } catch (error) {
      console.error("解析失败:", error);
      throw error;
    }
  }

  /**
   * 获取已处理的文件列表
   */
  public getProcessedFiles(): string[] {
    console.warn('警告: 使用已弃用的getProcessedFiles方法');
    return this.newResourceManager.getFileList();
  }

  /**
   * 获取所有文件列表
   */
  public getFileList(): string[] {
    console.warn('警告: 使用已弃用的getFileList方法');
    return this.newResourceManager.getFileList();
  }

  /**
   * 获取顶层文件列表
   */
  public getTopLevelFiles(): string[] {
    console.warn('警告: 使用已弃用的getTopLevelFiles方法');
    return this.newResourceManager.getTopLevelFiles();
  }

  /**
   * 设置远程URL（向后兼容性方法）
   */
  public setRemoteUrl(_remoteUrl: string): void {
    console.warn('警告: 使用已弃用的setRemoteUrl方法');
    // 这个方法在新的ResourceManager中不可用
  }

  /**
   * 设置基础路径（向后兼容性方法）
   */
  public setBasePath(_basePath: string): void {
    console.warn('警告: 使用已弃用的setBasePath方法');
    // 这个方法在新的ResourceManager中不可用
  }

  /**
   * 设置配置（向后兼容性方法）
   */
  public setConfig(_config: Partial<IConfig>): void {
    console.warn('警告: 使用已弃用的setConfig方法');
    // 这个方法在新的ResourceManager中不可用
  }

  /**
   * 设置日志器（向后兼容性方法）
   */
  public setLogger(_logger: ILogger): void {
    console.warn('警告: 使用已弃用的setLogger方法');
    // 这个方法在新的ResourceManager中不可用
  }

  /**
   * 设置文件处理器（向后兼容性方法）
   */
  public setFileProcessor(_fileProcessor: any): void {
    console.warn('警告: 使用已弃用的setFileProcessor方法');
    // 这个方法在新的ResourceManager中不可用
  }
}

/**
 * 创建ResourceManager的工厂函数（向后兼容）
 * 
 * @deprecated 使用 createResourceManager (从 src/core 导入)
 */
export function createLegacyResourceManager(
  base: string,
  remote: string,
  config?: Partial<IConfig>,
  debugEnabled: boolean = false
): ResourceManager {
  console.warn('警告: 使用已弃用的createLegacyResourceManager函数，请使用 createResourceManager (从 src/core 导入)');
  
  // 创建新的ResourceManager
  const options: ResourceManagerOptions = {
    base,
    remote,
    concurrency: config?.concurrency ?? 5,
    debug: debugEnabled,
    config: config ? {
      concurrency: config.concurrency,
      topLevelHierarchyExtensions: config.topLevelHierarchyExtensions,
      parsableHierarchyExtensions: config.parsableHierarchyExtensions,
      ignoredHierarchyExtensions: config.ignoredHierarchyExtensions,
      filePathPattern: config.filePathPattern
    } : undefined
  };

  const newResourceManager = createNewResourceManager(options);
  
  // 返回适配器
  return new (class extends ResourceManager {
    constructor() {
      super(base, config as IConfig, {
        info: (msg: string) => console.log(msg),
        error: (msg: string, err?: any) => console.error(msg, err),
        debug: (msg: string) => debugEnabled && console.debug(msg),
        warn: (msg: string) => console.warn(msg),
        createChildLogger: (prefix: string) => ({
          info: (msg: string) => console.log(`[${prefix}] ${msg}`),
          error: (msg: string, err?: any) => console.error(`[${prefix}] ${msg}`, err),
          debug: (msg: string) => debugEnabled && console.debug(`[${prefix}] ${msg}`),
          warn: (msg: string) => console.warn(`[${prefix}] ${msg}`),
          createChildLogger: () => this as any
        })
      } as any);
      
      // 替换内部的newResourceManager
      (this as any).newResourceManager = newResourceManager;
    }
  })();
}