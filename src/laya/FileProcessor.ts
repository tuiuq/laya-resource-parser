/**
 * 向后兼容的FileProcessor
 * 
 * 注意：这个类是为了保持向后兼容性而保留的
 * 新的代码应该使用 src/processors/ProcessorFactory.ts
 */

import type { IConfig, IFileProcessor, ILogger } from "./interface";

/**
 * @deprecated 使用新的 ProcessorFactory (从 src/processors 导入)
 */
export class FileProcessor implements IFileProcessor {
  private readonly processedFiles: Set<string> = new Set();
  private readonly fileList: Set<string> = new Set();

  constructor(
    private readonly config: IConfig,
    private readonly logger: ILogger
  ) {
    console.warn('警告: 使用已弃用的FileProcessor，请迁移到新的ProcessorFactory (从 src/processors 导入)');
  }

  /**
   * 解析层级文件
   */
  public async parseHierarchyFile(filePath: string, depth: number): Promise<void> {
    console.warn('警告: FileProcessor.parseHierarchyFile() 方法已弃用');
    
    // 标记为已处理
    this.processedFiles.add(filePath);
    this.fileList.add(filePath);
    
    this.logger.info(`解析文件 [深度 ${depth}]: ${filePath}`);
    
    // 模拟文件处理
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * 检查是否可解析
   */
  public isParsable(path: string): boolean {
    console.warn('警告: FileProcessor.isParsable() 方法已弃用');
    
    for (const extension of this.config.parsableHierarchyExtensions) {
      if (path.endsWith(extension)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 检查是否为顶层文件
   */
  public isTopLevelHierarchy(path: string): boolean {
    console.warn('警告: FileProcessor.isTopLevelHierarchy() 方法已弃用');
    
    for (const extension of this.config.topLevelHierarchyExtensions) {
      if (path.endsWith(extension)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取已处理的文件列表
   */
  public getProcessedFiles(): string[] {
    console.warn('警告: FileProcessor.getProcessedFiles() 方法已弃用');
    return Array.from(this.processedFiles);
  }

  /**
   * 获取所有文件列表
   */
  public getFileList(): string[] {
    console.warn('警告: FileProcessor.getFileList() 方法已弃用');
    return Array.from(this.fileList);
  }

  /**
   * 清空处理状态
   */
  public clear(): void {
    console.warn('警告: FileProcessor.clear() 方法已弃用');
    this.processedFiles.clear();
    this.fileList.clear();
  }

  /**
   * 获取处理统计信息
   */
  public getStats(): {
    processedCount: number;
    fileListCount: number;
  } {
    console.warn('警告: FileProcessor.getStats() 方法已弃用');
    
    return {
      processedCount: this.processedFiles.size,
      fileListCount: this.fileList.size
    };
  }
}