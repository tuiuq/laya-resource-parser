import { stat, writeFile } from "node:fs/promises";
import type { IDownloadManager, ILogger, IPathResolver } from "./interface";
import { Logger } from "./Logger";

export class DownloadManager implements IDownloadManager {
  private readonly logger: ILogger;

  constructor(
    private readonly pathResolver: IPathResolver,
    logger?: Logger
  ) {
    if (logger) {
      this.logger = logger.createChildLogger("DownloadManager");
    } else {
      this.logger = new Logger("ResourceManager:DownloadManager")
    }
  }

  public async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const url = this.pathResolver.resolveRemoteUrl(filePath);
      this.logger.debug(`正在下载: ${url.toString()}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const localPath = this.getLocalFilePath(filePath);
      await writeFile(localPath, buffer);

      this.logger.debug(`下载完成: ${filePath} (${buffer.length} bytes)`)
      return buffer;
    } catch (err) {
      this.logger.error(`下载文件失败: ${filePath}`, err);
      throw err;
    }
  }

  public async isLocalFileExists(filePath: string): Promise<boolean> {
    try {
      await stat(this.getLocalFilePath(filePath))
      return true;
    } catch {
      return false;
    }
  }

  public getLocalFilePath(filePath: string): string {
    return this.pathResolver.resolveLocalPath(filePath)
  }
}
