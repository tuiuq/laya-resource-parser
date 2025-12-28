import { walkFile } from "@/utils/walkFile";
import pLimit from "p-limit";
import { ConfigManager } from "./ConfigManager";
import { DownloadManager } from "./DownloadManager";
import { FileProcessor } from "./FileProcessor";
import type { IConfig } from "./interface";
import { Logger, LogLevel } from "./Logger";
import { PathResolver } from "./PathResolver";

export class ResourceManager {
  private readonly config: IConfig;
  private readonly logger: Logger;
  private readonly pathResolver: PathResolver;
  private readonly downloadManager: DownloadManager;
  private readonly fileProcessor: FileProcessor;
  private readonly topLevelHierarchyFiles: Set<string> = new Set();

  constructor(
    private readonly base: string,
    remote: string,
    config?: Partial<IConfig>,
    debugEnabled: boolean = false
  ) {
    this.config = new ConfigManager(config);
    this.logger = new Logger("ResourceManager", debugEnabled ? LogLevel.DEBUG : LogLevel.INFO);
    this.pathResolver = new PathResolver(this.base, new URL(remote));
    this.downloadManager = new DownloadManager(this.pathResolver, this.logger);
    this.fileProcessor = new FileProcessor(this.config, this.downloadManager, this.logger);
  }

  /**
   * 解析所有资源文件
   */
  public async parse(): Promise<void> {
    this.logger.info(`开始收集顶层资源文件, 基础目录: ${this.base}`);
    await this.collectTopLevelHierarchyFiles();
    this.logger.info(`收集顶层资源文件完成, 共 ${this.topLevelHierarchyFiles.size} 个文件`);

    const limit = pLimit(this.config.concurrency);
    const tasks = Array.from(this.topLevelHierarchyFiles)
      .map(filePath => limit(async () => {
        try {
          await this.fileProcessor.parseHierarchyFile(filePath, 0);
          this.logger.info(`✓ 解析成功: ${filePath}`);
        } catch (err) {
          this.logger.error(`✗ 解析失败: ${filePath}`, err);
          throw err;
        }
      }));

    await Promise.all(tasks);

    const fileList = this.fileProcessor.getFileList();
    this.logger.info(`\n解析完成, 共处理 ${fileList.length} 个文件`);
    this.logger.info("文件列表: ");
    fileList.sort().forEach(file => this.logger.info(`  - ${file}`));
  }

  /**
   * 收集顶层层级文件
   */
  private async collectTopLevelHierarchyFiles(): Promise<void> {
    const files = await walkFile(this.base, {
      root: this.base,
      filter: (path) => this.fileProcessor.isTopLevelHierarchy(path)
    });

    for (const file of files) {
      this.topLevelHierarchyFiles.add(file);
    }
  }

  /**
   * 获取已处理的文件列表
   */
  public getProcessedFiles(): string[] {
    return this.fileProcessor.getProcessedFiles();
  }


  /**
   * 获取所有文件列表
   */
  public getFileList(): string[] {
    return this.fileProcessor.getFileList();
  }

  /**
   * 获取顶层文件列表
   */
  public getTopLevelFiles(): string[] {
    return Array.from(this.topLevelHierarchyFiles);
  }

}
