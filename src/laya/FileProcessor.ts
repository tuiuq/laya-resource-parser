import { looksLikeAssetPath } from "@/utils/looksLikeAssetPath";
import { readArrayBuffer } from "@/utils/readArrayBuffer";
import { readJSON } from "@/utils/readJSON";
import { traverseData } from "@/utils/traverseData";
import type { TraversePath } from "@/utils/types";
import { dirname, join } from "node:path";
import type { IConfig, IDownloadManager, IFileProcessor, ILogger } from "./interface";
import { Logger } from "./Logger";

export class FileProcessor implements IFileProcessor {
  private readonly processedFiles: Set<string> = new Set();
  private readonly fileList: Set<string> = new Set();
  private readonly logger: Logger;

  constructor(
    private readonly config: IConfig,
    private readonly downloadManager: IDownloadManager,
    logger?: ILogger
  ) {
    if (logger) {
      this.logger = logger.createChildLogger("FileProcessor");
    } else {
      this.logger = new Logger("ResourceManager:FileProcessor")
    }
  }

  public async parseHierarchyFile(filePath: string, depth: number): Promise<void> {
    const depthPrefix = "  ".repeat(depth);
    const depthIndicator = depth > 0 ? `[深度 ${depth}]` : "";

    // 避免重复处理同一个文件
    if (this.processedFiles.has(filePath)) {
      this.logger.debug(`${depthPrefix}${depthIndicator}跳过已处理文件: ${filePath}`);
      return;
    }

    this.logger.info(`${depthPrefix}${depthIndicator}开始解析文件: ${filePath}`);
    this.processedFiles.add(filePath);
    this.fileList.add(filePath);

    // 确保本地文件存在
    if (!await this.downloadManager.isLocalFileExists(filePath)) {
      this.logger.debug(`${depthPrefix}  ${depthIndicator}下载文件: ${filePath}`);
      await this.downloadManager.downloadFile(filePath);
    } else {
      this.logger.debug(`${depthPrefix}  ${depthIndicator}本地文件已存在: ${filePath}`);
    }

    // 检查是否为可解析的文件类型
    if (!this.isParsable(filePath)) {
      this.logger.debug(`${depthPrefix}  ${depthIndicator}跳过不可解析的文件类型: ${filePath}`);
      return;
    }

    const json = await this.readFileContent(filePath, depthPrefix, depthIndicator);

    // 递归处理文件中的资源引用
    const dir = dirname(filePath);
    this.logger.debug(`${depthPrefix}  ${depthIndicator}开始遍历文件中的资源引用: ${filePath}`);

    let referenceCount = 0;
    await traverseData(
      json,
      async (_: TraversePath, __: string, value: string) => {
        if (
          looksLikeAssetPath(value) &&
          this.config.filePathPattern.test(value)
        ) {
          referenceCount++;
          const referencedPath = join(dir, value);
          this.logger.debug(`${depthPrefix}    ${depthIndicator}发现资源引用 [${referenceCount}]: ${value} -> ${referencedPath}`);
          await this.parseHierarchyFile(referencedPath, depth + 1);
        }
      },
      {
        filter(_, key: string) {
          return key === "name"
        }
      }
    );

    this.logger.debug(`${depthPrefix}  ${depthIndicator}完成遍历资源引用，共发现 ${referenceCount} 个引用`);
    this.logger.info(`${depthPrefix}${depthIndicator}完成解析文件: ${filePath}`);
  }

  private async readFileContent(
    filePath: string,
    depthPrefix: string,
    depthIndicator: string,
  ): Promise<any> {
    const localFilePath = this.downloadManager.getLocalFilePath(filePath);
    try {
      this.logger.debug(`${depthPrefix}  ${depthIndicator}读取JSON文件: ${filePath}`);
      const json = await readJSON(localFilePath);
      this.logger.debug(`${depthPrefix}  ${depthIndicator}JSON读取成功: ${filePath}`);
      return json;
    } catch (jsonError) {
      this.logger.debug(`${depthPrefix}  ${depthIndicator}JSON读取失败，尝试其他格式: ${filePath}`);

      try {
        // 尝试读取原始二进制数据并转换为JSON
        this.logger.debug(`${depthPrefix}    ${depthIndicator}尝试读取原始二进制数据并转换为JSON: ${filePath}`);
        const content = await readArrayBuffer(localFilePath);
        if (content.byteLength === 0) {
          throw new Error(`文件为空: ${filePath}`);
        }

        this.logger.debug(`${depthPrefix}    ${depthIndicator}转换二进制数据为文本: ${filePath}`);
        const text = Buffer.from(content).toString("utf-8");
        const json = JSON.parse(text);
        this.logger.debug(`${depthPrefix}    ${depthIndicator}二进制数据解析成功: ${filePath}`);
        return json;
      } catch (bufferError) {
        this.logger.debug(`${depthPrefix}    ${depthIndicator}本地文件解析失败，尝试重新下载: ${filePath}`);

        try {
          // 重新下载文件
          this.logger.debug(`${depthPrefix}      ${depthIndicator}重新下载文件: ${filePath}`);
          const buffer = await this.downloadManager.downloadFile(filePath);
          const json = JSON.parse(buffer.toString("utf-8"));
          this.logger.debug(`${depthPrefix}      ${depthIndicator}重新下载并解析成功: ${filePath}`);
          return json;
        } catch (downloadError) {
          this.logger.error(`${depthPrefix}      ${depthIndicator}文件处理失败: ${filePath}`, {
            jsonError: jsonError instanceof Error ? jsonError.message : jsonError,
            bufferError: bufferError instanceof Error ? bufferError.message : bufferError,
            downloadError: downloadError instanceof Error ? downloadError.message : downloadError
          });
          throw new Error(`无法处理文件: ${filePath}`);
        }
      }
    }
  }

  public isParsable(path: string): boolean {
    if (this.endsWithAny(path, this.config.ignoredHierarchyExtensions)) {
      return false;
    }

    return this.endsWithAny(path, this.config.parsableHierarchyExtensions);
  }

  public isTopLevelHierarchy(path: string): boolean {
    if (this.endsWithAny(path, this.config.ignoredHierarchyExtensions)) {
      return false;
    }

    return this.endsWithAny(path, this.config.topLevelHierarchyExtensions);
  }

  private endsWithAny(path: string, suffixes: string[]): boolean {
    for (const suffix of suffixes) {
      if (path.endsWith(suffix)) return true;
    }

    return false;
  }

  public getProcessedFiles(): string[] {
    return Array.from(this.processedFiles);
  }

  public getFileList(): string[] {
    return Array.from(this.fileList);
  }
}
