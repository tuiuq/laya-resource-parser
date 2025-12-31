/**
 * 路径解析器
 */

import type { IPathResolver } from '../laya/interface';
import type { Logger } from '../logger/Logger';
import { ResourceParserError, ErrorCode } from '../types/core';

/**
 * 路径解析器实现
 */
export class PathResolver implements IPathResolver {
  private readonly logger: Logger;
  private readonly basePath: string;
  private readonly remoteUrl: URL;
  private readonly cache: Map<string, string> = new Map();
  private readonly urlCache: Map<string, URL> = new Map();

  constructor(basePath: string, remoteUrl: URL, logger?: Logger) {
    this.basePath = basePath;
    this.remoteUrl = remoteUrl;
    
    if (logger) {
      this.logger = logger.createChildLogger('PathResolver');
    } else {
      const { Logger } = require('../logger/Logger');
      this.logger = new Logger('PathResolver');
    }
    
    this.logger.debug('路径解析器初始化完成', {
      basePath,
      remoteUrl: remoteUrl.toString()
    });
  }

  /**
   * 解析远程URL
   */
  public resolveRemoteUrl(filePath: string): URL {
    const cacheKey = `remote:${filePath}`;
    
    // 检查缓存
    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey)!;
    }

    try {
      // 规范化路径
      const normalizedPath = this.normalizePath(filePath);
      
      // 构建完整URL
      const url = new URL(normalizedPath, this.remoteUrl);
      
      // 缓存结果
      this.urlCache.set(cacheKey, url);
      
      this.logger.debug(`解析远程URL: ${filePath} -> ${url.toString()}`);
      
      return url;
    } catch (error) {
      this.logger.error(`解析远程URL失败: ${filePath}`, error);
      throw new ResourceParserError(
        `解析远程URL失败: ${filePath}`,
        ErrorCode.URL_INVALID,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 解析本地路径
   */
  public resolveLocalPath(filePath: string): string {
    const cacheKey = `local:${filePath}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const { join } = require('path');
      
      // 规范化路径
      const normalizedPath = this.normalizePath(filePath);
      
      // 构建完整本地路径
      const localPath = join(this.basePath, normalizedPath);
      
      // 缓存结果
      this.cache.set(cacheKey, localPath);
      
      this.logger.debug(`解析本地路径: ${filePath} -> ${localPath}`);
      
      return localPath;
    } catch (error) {
      this.logger.error(`解析本地路径失败: ${filePath}`, error);
      throw new ResourceParserError(
        `解析本地路径失败: ${filePath}`,
        ErrorCode.FILE_NOT_FOUND,
        filePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 规范化路径
   */
  public normalizePath(path: string): string {
    if (!path) {
      return '';
    }

    try {
      const { normalize, sep } = require('path');
      
      // 替换路径分隔符为当前系统的分隔符
      let normalized = path.replace(/[\\/]/g, sep);
      
      // 移除开头的 ./ 或 .\
      if (normalized.startsWith(`.${sep}`)) {
        normalized = normalized.slice(2);
      }
      
      // 规范化路径
      normalized = normalize(normalized);
      
      // 移除末尾的路径分隔符
      if (normalized.endsWith(sep)) {
        normalized = normalized.slice(0, -1);
      }
      
      return normalized;
    } catch (error) {
      this.logger.warn(`路径规范化失败，返回原始路径: ${path}`, error);
      return path;
    }
  }

  /**
   * 获取相对路径
   */
  public getRelativePath(fromPath: string, toPath: string): string {
    try {
      const { relative } = require('path');
      const from = this.resolveLocalPath(fromPath);
      const to = this.resolveLocalPath(toPath);
      return relative(from, to);
    } catch (error) {
      this.logger.error(`获取相对路径失败: ${fromPath} -> ${toPath}`, error);
      throw new ResourceParserError(
        `获取相对路径失败: ${fromPath} -> ${toPath}`,
        ErrorCode.PROCESSING_ERROR,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 获取绝对路径
   */
  public getAbsolutePath(relativePath: string): string {
    try {
      const { resolve, isAbsolute } = require('path');
      
      if (isAbsolute(relativePath)) {
        return this.normalizePath(relativePath);
      }
      
      return resolve(this.basePath, relativePath);
    } catch (error) {
      this.logger.error(`获取绝对路径失败: ${relativePath}`, error);
      throw new ResourceParserError(
        `获取绝对路径失败: ${relativePath}`,
        ErrorCode.PROCESSING_ERROR,
        relativePath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 检查路径是否为绝对路径
   */
  public isAbsolutePath(path: string): boolean {
    try {
      const { isAbsolute } = require('path');
      return isAbsolute(path);
    } catch (error) {
      this.logger.warn(`检查绝对路径失败: ${path}`, error);
      return false;
    }
  }

  /**
   * 获取文件扩展名
   */
  public getFileExtension(path: string): string {
    try {
      const { extname } = require('path');
      return extname(path).toLowerCase();
    } catch (error) {
      this.logger.warn(`获取文件扩展名失败: ${path}`, error);
      return '';
    }
  }

  /**
   * 获取文件名（不含扩展名）
   */
  public getFileNameWithoutExtension(path: string): string {
    try {
      const { basename } = require('path');
      const fileName = basename(path);
      const extension = this.getFileExtension(fileName);
      return extension ? fileName.slice(0, -extension.length) : fileName;
    } catch (error) {
      this.logger.warn(`获取文件名失败: ${path}`, error);
      return path;
    }
  }

  /**
   * 获取目录名
   */
  public getDirectoryName(path: string): string {
    try {
      const { dirname } = require('path');
      return dirname(path);
    } catch (error) {
      this.logger.warn(`获取目录名失败: ${path}`, error);
      return '';
    }
  }

  /**
   * 连接路径
   */
  public joinPath(...paths: string[]): string {
    try {
      const { join } = require('path');
      return this.normalizePath(join(...paths));
    } catch (error) {
      this.logger.warn(`连接路径失败: ${paths.join(', ')}`, error);
      return paths.join('/');
    }
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.urlCache.clear();
    this.logger.debug('路径解析器缓存已清空');
  }

  /**
   * 获取基础路径
   */
  public getBasePath(): string {
    return this.basePath;
  }

  /**
   * 获取远程URL
   */
  public getRemoteUrl(): URL {
    return new URL(this.remoteUrl.toString());
  }

  /**
   * 设置基础路径
   */
  public setBasePath(basePath: string): void {
    (this as any).basePath = basePath;
    this.clearCache();
    this.logger.debug(`设置基础路径: ${basePath}`);
  }

  /**
   * 设置远程URL
   */
  public setRemoteUrl(remoteUrl: URL): void {
    (this as any).remoteUrl = new URL(remoteUrl.toString());
    this.clearCache();
    this.logger.debug(`设置远程URL: ${remoteUrl.toString()}`);
  }

  /**
   * 获取缓存统计信息
   */
  public getCacheStats(): {
    localCacheSize: number;
    urlCacheSize: number;
  } {
    return {
      localCacheSize: this.cache.size,
      urlCacheSize: this.urlCache.size
    };
  }

  /**
   * 验证路径是否有效
   */
  public validatePath(path: string): {
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查空路径
    if (!path || path.trim() === '') {
      errors.push('路径不能为空');
    }

    // 检查非法字符
    const illegalChars = /[<>:"|?*]/;
    if (illegalChars.test(path)) {
      errors.push('路径包含非法字符: <>:"|?*');
    }

    // 检查路径深度
    const depth = path.split(/[\\/]/).length;
    if (depth > 100) {
      warnings.push('路径深度过大，可能影响性能');
    }

    // 检查相对路径
    if (path.startsWith('..')) {
      warnings.push('路径包含上级目录引用，可能存在安全风险');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
}