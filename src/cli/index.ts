/**
 * CLI入口
 */

import { Command } from "commander";
import { join } from "node:path";
import { version } from "../../package.json";
import { createResourceManager } from "../core";
import type { ResourceManagerOptions } from "../types/core";

export async function main() {
  const program = new Command();

  program
    .name("laya-resource-parser")
    .alias("lr")
    .version(version, "-V, --version")
    .description("Laya资源解析器 - 解析Laya项目中的资源依赖关系");

  // 基础命令
  program
    .command("parse")
    .description("解析资源依赖关系")
    .option(
      "-b, --base <path>",
      "基础路径（默认为当前目录下的src目录）",
      join(process.cwd(), "src")
    )
    .requiredOption(
      "-r, --remote <url>",
      "远程资源URL（必须为有效的HTTP/HTTPS URL）",
      (value: string) => {
        if (!value.trim()) {
          throw new Error("远程URL不能为空");
        }

        try {
          const url = new URL(value);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error("远程URL必须是有效的HTTP或HTTPS URL");
          }

          return value;
        } catch {
          throw new Error("远程URL必须是有效的HTTP或HTTPS URL");
        }
      }
    )
    .option("-c, --concurrency <number>", "并发处理数", "5")
    .option("-d, --debug", "启用调试模式", false)
    .option("--no-cache", "禁用缓存", false)
    .option("--timeout <ms>", "超时时间（毫秒）", "30000")
    .option("--retry <count>", "重试次数", "3")
    .option("--config <path>", "配置文件路径")
    .option("--output <format>", "输出格式（json, yaml, text）", "text")
    .action(async (options: any) => {
      try {
        const resourceManagerOptions: ResourceManagerOptions = {
          base: options.base,
          remote: options.remote,
          concurrency: parseInt(options.concurrency),
          debug: options.debug,
          config: {
            enableCache: options.cache,
            timeout: parseInt(options.timeout),
            retryCount: parseInt(options.retry)
          }
        };

        const resourceManager = createResourceManager(resourceManagerOptions);
        const result = await resourceManager.parse();
        
        // 输出结果
        switch (options.output.toLowerCase()) {
          case "json":
            console.log(JSON.stringify(result, null, 2));
            break;
          case "yaml":
            const yaml = require("yaml");
            console.log(yaml.stringify(result));
            break;
          case "text":
          default:
            console.log("\n=== 资源解析结果 ===");
            console.log(`总文件数: ${result.totalFiles}`);
            console.log(`成功处理: ${result.successFiles}`);
            console.log(`失败处理: ${result.failedFiles}`);
            console.log(`\n文件列表 (${result.fileList.length}):`);
            result.fileList.sort().forEach(file => console.log(`  - ${file}`));
            
            if (result.errors.length > 0) {
              console.log(`\n错误列表 (${result.errors.length}):`);
              result.errors.forEach(error => {
                console.log(`  - ${error.filePath}: ${error.error.message}`);
              });
            }
            break;
        }
        
        process.exit(result.failedFiles > 0 ? 1 : 0);
      } catch (error) {
        console.error("解析失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 配置命令
  program
    .command("config")
    .description("管理配置")
    .option("--init", "初始化配置文件")
    .option("--validate <path>", "验证配置文件")
    .option("--show", "显示当前配置")
    .action(async (options: any) => {
      try {
        if (options.init) {
          const { DEFAULT_APP_CONFIG } = await import("../core");
          const fs = await import("fs/promises");
          const yaml = await import("yaml");
          
          const configContent = yaml.stringify(DEFAULT_APP_CONFIG);
          await fs.writeFile("laya-config.yaml", configContent);
          console.log("配置文件已创建: laya-config.yaml");
        } else if (options.validate) {
          const { createConfigManager } = await import("../core");
          const configManager = createConfigManager({
            configPath: options.validate
          });
          
          if (configManager.hasValidationErrors()) {
            console.error("配置验证失败:");
            configManager.getValidationErrors().forEach(error => console.error(`  - ${error}`));
            process.exit(1);
          } else if (configManager.hasValidationWarnings()) {
            console.warn("配置验证警告:");
            configManager.getValidationWarnings().forEach(warning => console.warn(`  - ${warning}`));
          } else {
            console.log("配置验证通过");
          }
        } else if (options.show) {
          const { createConfigManager } = await import("../core");
          const configManager = createConfigManager();
          console.log(configManager.toJSON());
        } else {
          program.help();
        }
      } catch (error) {
        console.error("配置操作失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 工具命令
  program
    .command("utils")
    .description("工具命令")
    .option("--clear-cache", "清空缓存")
    .option("--stats", "显示统计信息")
    .action(async (options: any) => {
      try {
        if (options.clearCache) {
          const fs = await import("fs/promises");
          const fsSync = await import("fs");
          const path = await import("path");
          
          const cacheDir = path.join(process.cwd(), ".laya-cache");
          if (fsSync.existsSync(cacheDir)) {
            await fs.rm(cacheDir, { recursive: true });
            console.log("缓存已清空");
          } else {
            console.log("缓存目录不存在");
          }
        } else if (options.stats) {
          // 这里可以添加统计信息显示逻辑
          console.log("统计功能开发中...");
        } else {
          program.help();
        }
      } catch (error) {
        console.error("工具操作失败:", error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // 帮助命令
  program
    .command("help")
    .description("显示帮助信息")
    .action(() => {
      program.help();
    });

  // 如果没有提供命令，显示帮助
  if (process.argv.length <= 2) {
    program.help();
  }

  await program.parseAsync(process.argv);
}