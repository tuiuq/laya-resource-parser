/**
 * 向后兼容的DownloadManager
 * 
 * 注意：这个类是为了保持向后兼容性而保留的
 * 新的代码应该使用 src/downloaders/DownloadManager.ts
 */

import type { IDownloadManager, IPathResolver, ILogger } from './interface';

/**
 * @deprecated 使用新的 DownloadManager (从 src/downloaders 导入)
 */
export class DownloadManager implements IDownloadManager {
  constructor(
    private readonly pathResolver: IPathResolver,
    private readonly logger: ILogger
  ) {
    console.warn('警告: 使用已弃用的DownloadManager，请迁移到新的DownloadManager (从 src/downloaders 导入)');
  }

  /**
   * 下载文件
   */
  public async downloadFile(filePath: string): Promise<Buffer> {
    console.warn('警告: DownloadManager.downloadFile() 方法已弃用');
    
    try {
      // 模拟下载
      const url = this.pathResolver.resolveRemoteUrl(filePath);
      this.logger.info(`下载文件: ${filePath} (${url.toString()})`);
      
      // 返回空的Buffer
      return Buffer.from('');
    } catch (error) {
      this.logger.error(`下载失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 检查本地文件是否存在
   */
  public async isLocalFileExists(_filePath: string): Promise<boolean> {
    console.warn('警告: DownloadManager.isLocalFileExists() 方法已弃用');
    
    // 总是返回false，强制重新下载
    return false;
  }

  /**
   * 获取本地文件路径
   */
  public getLocalFilePath(filePath: string): string {
    console.warn('警告: DownloadManager.getLocalFilePath() 方法已弃用');
    
    // 返回模拟路径
    return `/tmp/${filePath}`;
  }

  /**
   * 设置最大并发下载数
   */
  public setMaxConcurrentDownloads(_max: number): void {
    console.warn('警告: DownloadManager.setMaxConcurrentDownloads() 方法已弃用');
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    console.warn('警告: DownloadManager.clearCache() 方法已弃用');
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    size: number;
    totalBytes: number;
    files: string[];
  } {
    console.warn('警告: DownloadManager.getCacheStats() 方法已弃用');
    
    return {
      size: 0,
      totalBytes: 0,
      files: []
    };
  }
}