/**
 * 向后兼容的PathResolver
 * 
 * 注意：这个类是为了保持向后兼容性而保留的
 * 新的代码应该使用 src/resolvers/PathResolver.ts
 */

import type { IPathResolver } from './interface';

/**
 * @deprecated 使用新的 PathResolver (从 src/resolvers 导入)
 */
export class PathResolver implements IPathResolver {
  constructor(
    private readonly basePath: string,
    private readonly remoteUrl: URL
  ) {
    console.warn('警告: 使用已弃用的PathResolver，请迁移到新的PathResolver (从 src/resolvers 导入)');
  }

  /**
   * 解析远程URL
   */
  public resolveRemoteUrl(filePath: string): URL {
    console.warn('警告: PathResolver.resolveRemoteUrl() 方法已弃用');
    
    try {
      // 构建完整URL
      const url = new URL(filePath, this.remoteUrl);
      return url;
    } catch (error) {
      // 如果解析失败，返回默认URL
      return new URL(this.remoteUrl.toString());
    }
  }

  /**
   * 解析本地路径
   */
  public resolveLocalPath(filePath: string): string {
    console.warn('警告: PathResolver.resolveLocalPath() 方法已弃用');
    
    // 简单的路径拼接
    const path = require('path');
    return path.join(this.basePath, filePath);
  }

  /**
   * 规范化路径
   */
  public normalizePath(path: string): string {
    console.warn('警告: PathResolver.normalizePath() 方法已弃用');
    
    // 简单的路径规范化
    const pathModule = require('path');
    return pathModule.normalize(path);
  }

  /**
   * 获取基础路径
   */
  public getBasePath(): string {
    console.warn('警告: PathResolver.getBasePath() 方法已弃用');
    return this.basePath;
  }

  /**
   * 获取远程URL
   */
  public getRemoteUrl(): URL {
    console.warn('警告: PathResolver.getRemoteUrl() 方法已弃用');
    return new URL(this.remoteUrl.toString());
  }

  /**
   * 设置基础路径
   */
  public setBasePath(basePath: string): void {
    console.warn('警告: PathResolver.setBasePath() 方法已弃用');
    (this as any).basePath = basePath;
  }

  /**
   * 设置远程URL
   */
  public setRemoteUrl(remoteUrl: URL): void {
    console.warn('警告: PathResolver.setRemoteUrl() 方法已弃用');
    (this as any).remoteUrl = new URL(remoteUrl.toString());
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    console.warn('警告: PathResolver.clearCache() 方法已弃用');
    // 这个实现没有缓存
  }

  /**
   * 获取相对路径
   */
  public getRelativePath(fromPath: string, toPath: string): string {
    console.warn('警告: PathResolver.getRelativePath() 方法已弃用');
    
    const path = require('path');
    return path.relative(fromPath, toPath);
  }

  /**
   * 获取绝对路径
   */
  public getAbsolutePath(relativePath: string): string {
    console.warn('警告: PathResolver.getAbsolutePath() 方法已弃用');
    
    const path = require('path');
    return path.resolve(this.basePath, relativePath);
  }

  /**
   * 检查路径是否为绝对路径
   */
  public isAbsolutePath(pathStr: string): boolean {
    console.warn('警告: PathResolver.isAbsolutePath() 方法已弃用');
    
    const path = require('path');
    return path.isAbsolute(pathStr);
  }

  /**
   * 获取文件扩展名
   */
  public getFileExtension(pathStr: string): string {
    console.warn('警告: PathResolver.getFileExtension() 方法已弃用');
    
    const path = require('path');
    return path.extname(pathStr);
  }

  /**
   * 获取文件名（不含扩展名）
   */
  public getFileNameWithoutExtension(pathStr: string): string {
    console.warn('警告: PathResolver.getFileNameWithoutExtension() 方法已弃用');
    
    const path = require('path');
    const fileName = path.basename(pathStr);
    const extension = this.getFileExtension(fileName);
    return extension ? fileName.slice(0, -extension.length) : fileName;
  }

  /**
   * 获取目录名
   */
  public getDirectoryName(pathStr: string): string {
    console.warn('警告: PathResolver.getDirectoryName() 方法已弃用');
    
    const path = require('path');
    return path.dirname(pathStr);
  }

  /**
   * 连接路径
   */
  public joinPath(...paths: string[]): string {
    console.warn('警告: PathResolver.joinPath() 方法已弃用');
    
    const path = require('path');
    return path.join(...paths);
  }
}