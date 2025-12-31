/**
 * 下载管理器
 */

import type { DownloaderConfig } from '../types/config';
import type { IDownloadManager } from '../laya/interface';
import type { Logger } from '../logger/Logger';
import { ResourceParserError, ErrorCode } from '../types/core';

/**
 * 下载管理器实现
 */
export class DownloadManager implements IDownloadManager {
  private readonly logger: Logger;
  private readonly config: DownloaderConfig;
  private readonly cache: Map<string, Buffer> = new Map();
  private readonly downloadQueue: Map<string, Promise<Buffer>> = new Map();
  private readonly activeDownloads: Set<string> = new Set();
  private readonly maxConcurrentDownloads: number = 5;

  constructor(config: DownloaderConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.createChildLogger('DownloadManager');
    this.logger.debug('下载管理器初始化完成', { config });
  }

  /**
   * 下载文件
   */
  public async downloadFile(filePath: string): Promise<Buffer> {
    // 检查缓存
    if (this.cache.has(filePath)) {
      this.logger.debug(`从缓存获取文件: ${filePath}`);
      return this.cache.get(filePath)!;
    }

    // 检查是否正在下载
    if (this.downloadQueue.has(filePath)) {
      this.logger.debug(`等待正在下载的文件: ${filePath}`);
      return this.downloadQueue.get(filePath)!;
    }

    // 创建下载任务
    const downloadPromise = this.createDownloadTask(filePath);
    this.downloadQueue.set(filePath, downloadPromise);

    try {
      const buffer = await downloadPromise;
      this.cache.set(filePath, buffer);
      return buffer;
    } finally {
      this.downloadQueue.delete(filePath);
      this.activeDownloads.delete(filePath);
    }
  }

  /**
   * 创建下载任务
   */
  private async createDownloadTask(filePath: string): Promise<Buffer> {
    // 等待并发限制
    await this.waitForConcurrencySlot();

    this.activeDownloads.add(filePath);
    this.logger.info(`开始下载文件: ${filePath}`);

    let retryCount = 0;
    const maxRetries = this.config.maxRetries || 3;

    while (retryCount <= maxRetries) {
      try {
        const buffer = await this.performDownload(filePath);
        this.logger.info(`下载完成: ${filePath}`, { size: buffer.length });
        return buffer;
      } catch (error) {
        retryCount++;
        
        if (retryCount > maxRetries) {
          this.logger.error(`下载失败，已达到最大重试次数: ${filePath}`, {
            retryCount,
            error
          });
          throw new ResourceParserError(
            `下载文件失败: ${filePath}`,
            ErrorCode.DOWNLOAD_ERROR,
            filePath,
            error instanceof Error ? error : undefined
          );
        }

        const retryDelay = this.config.retryDelay || 1000;
        this.logger.warn(`下载失败，准备重试 (${retryCount}/${maxRetries}): ${filePath}`, {
          error,
          nextRetryIn: `${retryDelay}ms`
        });

        await this.sleep(retryDelay * retryCount); // 指数退避
      }
    }

    throw new ResourceParserError(
      `下载文件失败: ${filePath}`,
      ErrorCode.DOWNLOAD_ERROR,
      filePath
    );
  }

  /**
   * 执行下载
   */
  private async performDownload(filePath: string): Promise<Buffer> {
    const url = this.resolveRemoteUrl(filePath);
    this.logger.debug(`下载URL: ${url.toString()}`);

    const controller = new AbortController();
    const timeout = this.config.timeout || 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.config.headers || {},
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ResourceParserError(
          `HTTP ${response.status}: ${response.statusText}`,
          ErrorCode.NETWORK_ERROR,
          filePath
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ResourceParserError(
          `下载超时: ${filePath}`,
          ErrorCode.TIMEOUT_ERROR,
          filePath
        );
      }
      
      throw error;
    }
  }

  /**
   * 等待并发槽位
   */
  private async waitForConcurrencySlot(): Promise<void> {
    while (this.activeDownloads.size >= this.maxConcurrentDownloads) {
      await this.sleep(100);
    }
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检查本地文件是否存在
   */
  public async isLocalFileExists(filePath: string): Promise<boolean> {
    try {
      const { access } = await import('fs/promises');
      const localPath = this.getLocalFilePath(filePath);
      await access(localPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取本地文件路径
   */
  public getLocalFilePath(filePath: string): string {
    const { join } = require('path');
    return join(process.cwd(), 'downloads', filePath);
  }

  /**
   * 如果需要则下载文件
   */
  public async downloadIfNeeded(filePath: string): Promise<void> {
    const exists = await this.isLocalFileExists(filePath);
    if (!exists) {
      await this.downloadFile(filePath);
      await this.saveToLocal(filePath);
    }
  }

  /**
   * 保存到本地文件
   */
  private async saveToLocal(filePath: string): Promise<void> {
    try {
      const buffer = this.cache.get(filePath);
      if (!buffer) {
        throw new Error('文件未下载');
      }

      const localPath = this.getLocalFilePath(filePath);
      const { mkdir, writeFile } = await import('fs/promises');
      const { dirname } = await import('path');

      // 创建目录
      await mkdir(dirname(localPath), { recursive: true });

      // 写入文件
      await writeFile(localPath, buffer);
      
      this.logger.debug(`文件保存到本地: ${localPath}`, { size: buffer.length });
    } catch (error) {
      this.logger.error(`保存文件到本地失败: ${filePath}`, error);
      throw new ResourceParserError(
        `保存文件失败: ${filePath}`,
        ErrorCode.FILE_WRITE_ERROR,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 解析远程URL
   */
  private resolveRemoteUrl(filePath: string): URL {
    try {
      const { join } = require('path');
      const baseUrl = new URL(this.config.baseUrl || 'http://localhost');
      const url = new URL(join(baseUrl.pathname, filePath), baseUrl);
      return url;
    } catch (error) {
      throw new ResourceParserError(
        `解析远程URL失败: ${filePath}`,
        ErrorCode.URL_INVALID,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.logger.debug('下载缓存已清空');
  }

  /**
   * 获取缓存大小
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    size: number;
    totalBytes: number;
    files: string[];
  } {
    let totalBytes = 0;
    const files: string[] = [];

    for (const [filePath, buffer] of this.cache) {
      totalBytes += buffer.length;
      files.push(filePath);
    }

    return {
      size: this.cache.size,
      totalBytes,
      files
    };
  }

  /**
   * 获取活动下载数量
   */
  public getActiveDownloadsCount(): number {
    return this.activeDownloads.size;
  }

  /**
   * 获取队列中的下载数量
   */
  public getQueuedDownloadsCount(): number {
    return this.downloadQueue.size;
  }

  /**
   * 设置最大并发下载数
   */
  public setMaxConcurrentDownloads(max: number): void {
    this.maxConcurrentDownloads = max;
    this.logger.debug(`设置最大并发下载数: ${max}`);
  }

  /**
   * 获取配置
   */
  public getConfig(): DownloaderConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<DownloaderConfig>): void {
    Object.assign(this.config, config);
    this.logger.debug('下载器配置已更新', { config });
  }
}