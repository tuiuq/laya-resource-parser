import {
  CONCURRENCY,
  FILE_PATH_PATTERN,
  IGNORED_HIERARCHY_SUFFIXES,
  PARSABLE_HIERARCHY_EXTENSIONS,
  TOP_LEVEL_HIERARCHY_EXTENSIONS
} from "@/constants";
import { looksLikeAssetPath } from "@/utils/looksLikeAssetPath";
import { readArrayBuffer } from "@/utils/readArrayBuffer";
import { readJSON } from "@/utils/readJSON";
import { traverseData } from "@/utils/traverseData";
import type { TraversePath } from "@/utils/types";
import { walkFile } from "@/utils/walkFile";
import { error, log } from "node:console";
import { stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { isUint16Array } from "node:util/types";
import pLimit from "p-limit";

export class ResourceManager {
  private readonly remote: URL;
  private readonly topLevelHierarchyFiles: Set<string> = new Set();
  private readonly fileList: Set<string> = new Set();
  private readonly processedFiles: Set<string> = new Set();

  constructor(
    private readonly base: string,
    remote: string,
  ) {
    this.remote = new URL(remote);
  }

  /**
   * 解析所有资源文件
   */
  public async parse(): Promise<void> {
    log(`开始收集顶层资源文件, 基础目录: ${this.base}`)
    await this.collectTopLevelHierarchyFiles();
    log(`收集顶层资源文件完成, 共 ${this.topLevelHierarchyFiles.size} 个文件`)

    const limit = pLimit(CONCURRENCY);
    const tasks = Array.from(this.topLevelHierarchyFiles)
      .map(filePath => limit(async () => {
        try {
          this.parseHierarchyFile(filePath);
          log(`✓ 解析成功: ${filePath}`)
        } catch (err) {
          error(`✗ 解析失败: ${filePath}`, error);
          throw err;
        }
      }))

    await Promise.all(tasks);

    log(`\n解析完成, 共处理 ${this.fileList.size} 个文件`)
    log("文件列表: ")
    Array.from(this.fileList).sort().forEach(file => log(`  - ${file}`))
  }

  /**
   * 收集顶层层级文件
   */
  private async collectTopLevelHierarchyFiles(): Promise<void> {
    const files = await walkFile(this.base, {
      root: this.base,
      filter: (path) => this.isTopLevelHierarchy(path)
    })

    for (const file of files) {
      this.topLevelHierarchyFiles.add(file);
    }
  }

  /**
   * 解析层级文件并递归处理依赖
   * @param {string} filePath - 文件路径
   * @returns
   */
  private async parseHierarchyFile(
    filePath: string,
    depth: number = 0
  ): Promise<void> {
    const depthPrefix = "  ".repeat(depth);
    const depthIndicator = depth > 0 ? `[深度 ${depth}] ` : "";

    // 避免重复处理同一个文件
    if (this.processedFiles.has(filePath)) {
      log(`${depthPrefix}${depthIndicator}跳过已处理文件: ${filePath}`);
      return;
    }
    log(`${depthPrefix}${depthIndicator}开始解析文件: ${filePath}`);
    this.processedFiles.add(filePath);
    this.fileList.add(filePath);

    // 确保本地文件存在
    if (!await this.isLocalFileExists(filePath)) {
      log(`${depthPrefix}  ${depthIndicator}下载文件: ${filePath}`);
      await this.downloadFile(filePath);
    } else {
      log(`${depthPrefix}  ${depthIndicator}本地文件已存在: ${filePath}`);
    }

    // 检查是否为可解析的文件类型
    if (!this.isParsable(filePath)) {
      log(`${depthPrefix}  ${depthIndicator}跳过不可解析的文件类型: ${filePath}`);
      return;
    }

    let json;
    const localFilePath = this.getLocalFilePath(filePath);
    try {
      log(`${depthPrefix}  ${depthIndicator}读取JSON文件: ${filePath}`);
      json = await readJSON(localFilePath);
      log(`${depthPrefix}  ${depthIndicator}JSON读取成功: ${filePath}`);
    } catch (jsonError) {
      log(`${depthPrefix}  ${depthIndicator}JSON读取失败，尝试其他格式: ${filePath}`);

      try {
        // 尝试读取原始二进制数据并转换为JSON
        log(`${depthPrefix}    ${depthIndicator}尝试读取原始二进制数据并转换为JSON: ${filePath}`);
        const content = await readArrayBuffer(localFilePath);
        if (content.byteLength === 0) {
          throw new Error(`文件为空: ${filePath}`)
        }

        log(`${depthPrefix}    ${depthIndicator}转换二进制数据为文本: ${filePath}`);
        const text = Buffer.from(content).toString("utf-8");
        json = JSON.parse(text);
        log(`${depthPrefix}    ${depthIndicator}二进制数据解析成功: ${filePath}`);
      } catch (bufferError) {
        log(`${depthPrefix}    ${depthIndicator}本地文件解析失败，尝试重新下载: ${filePath}`);

        try {
          // 重新下载文件
          log(`${depthPrefix}      ${depthIndicator}重新下载文件: ${filePath}`);
          const buffer = await this.downloadFile(filePath);
          json = JSON.parse(buffer.toString("utf-8"))
          log(`${depthPrefix}      ${depthIndicator}重新下载并解析成功: ${filePath}`);
        } catch (downloadError) {
          error(`${depthPrefix}      ${depthIndicator}文件处理失败: ${filePath}`, {
            jsonError: jsonError instanceof Error ? jsonError.message : jsonError,
            bufferError: bufferError instanceof Error ? bufferError.message : bufferError,
            downloadError: downloadError instanceof Error ? downloadError.message : downloadError
          });
          throw new Error(`无法处理文件: ${filePath}`)
        }
      }
    }

    // 递归处理文件中的资源引用
    const dir = dirname(filePath);
    log(`${depthPrefix}  ${depthIndicator}开始遍历文件中的资源引用: ${filePath}`);

    let referenceCount = 0;
    await traverseData(
      json,
      async (_: TraversePath, __: string, value: string) => {
        if (
          looksLikeAssetPath(value) &&
          FILE_PATH_PATTERN.test(value)
        ) {
          referenceCount++;
          const referencedPath = join(dir, value);
          log(`${depthPrefix}    ${depthIndicator}发现资源引用 [${referenceCount}]: ${value} -> ${referencedPath}`);
          await this.parseHierarchyFile(referencedPath, depth + 1);
        }
      },
      {
        filter(_, key: string) {
          return key === "name"
        }
      }
    )

    log(`${depthPrefix}  ${depthIndicator}完成遍历资源引用，共发现 ${referenceCount} 个引用`);
    log(`${depthPrefix}${depthIndicator}完成解析文件: ${filePath}`);
  }

  /**
   * 下载远程文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Buffer>} - 下载的文件内容
   */
  private async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const url = new URL(filePath, this.remote);
      log(`    正在下载: ${url.toString()}`);

      const response = await fetch(new URL(filePath, this.remote));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const localPath = this.getLocalFilePath(filePath);
      await writeFile(localPath, buffer);

      log(`    下载完成: ${filePath} (${buffer.length} bytes)`)
      return buffer;
    } catch (err) {
      error(`    下载文件失败: ${filePath}`, err);
      throw err;
    }
  }

  /**
   * 检查本地文件是否存在
   * @param filePath
   * @returns
   */
  private async isLocalFileExists(filePath: string): Promise<boolean> {
    try {
      await stat(this.getLocalFilePath(filePath))
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取本地文件路径
   * @param filePath
   * @returns
   */
  private getLocalFilePath(filePath: string): string {
    return join(
      this.base,
      filePath.replace(/\s/g, "_")
    );
  }

  private isTopLevelHierarchy(path: string): boolean {
    if (this.endsWithAny(path, IGNORED_HIERARCHY_SUFFIXES)) {
      return false;
    }
    return this.endsWithAny(path, TOP_LEVEL_HIERARCHY_EXTENSIONS);
  }

  private isParsable(path: string): boolean {
    if (this.endsWithAny(path, IGNORED_HIERARCHY_SUFFIXES)) {
      return false;
    }
    return this.endsWithAny(path, PARSABLE_HIERARCHY_EXTENSIONS);
  }

  private endsWithAny(path: string, suffixes: Array<string>) {
    for (const suffix of suffixes) {
      if (path.endsWith(suffix)) return true;
    }

    return false;
  }
}
