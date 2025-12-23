import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { normalizePath } from "./normalizePath";
import type { WalkFileOptions } from "./types";

/**
 * 递归遍历目录并返回匹配的文件路径列表
 *
 * @param {string} base - 要遍历的起始目录路径
 * @param {WalkFileOptions} options - 遍历选项
 * @param {string} [options.root] - 根目录路径, 用于计算相对路径，默认为 base 参数
 * @param {Function} [options.filter] - 文件过滤器, 接受相对路径参数，返回布尔值或Promise<boolean>
 * @param {Function} [options.ignoreDir] - 目录过滤器, 接受目录名和绝对路径参数，返回布尔值
 * @returns {Promise<string[]>} 匹配的文件相对路径数组 (相对于 root 目录)
 *
 * @example
 * ```typescript
 * // 遍历当前目录下的所有文件
 * const files = await walkFile('.');
 *
 * // 遍历并过滤只保留 .ts 文件
 * const tsFiles = await walkFile('./src', {
 *   filter: (relPath) => relPath.endsWith('.ts')
 * });
 *
 * // 遍历时忽略 node_modules 目录
 * const files = await walkFile('.', {
 *   ignoreDir: (dirName) => dirName === 'node_modules'
 * });
 * ```
 */
export async function walkFile(
  base: string,
  options: WalkFileOptions = {}
): Promise<string[]> {
  // 解构选项参数, 设置默认值
  const {
    root = base,                        // 跟目录，默认为 base
    filter = () => true,         // 文件过滤器，默认接受所有文件
    ignoreDir = () => false     // 目录过滤器，默认不忽略任何目录
  } = options;

  // 存储结果的数组
  const results: string[] = [];

  // 读取目录内容，包含文件类型信息
  const entries = await readdir(base, { withFileTypes: true });

  // 遍历目录中的每个条目
  for (const entry of entries) {
    // 构建绝对路径
    const absPath = join(base, entry.name);

    // 处理目录条目
    if (entry.isDirectory()) {
      // 检查是否应该忽略此目录
      if (options.ignoreDir?.(entry.name, absPath)) {
        // 跳过被忽略的目录
        continue;
      }

      // 递归遍历子目录
      const sub = await walkFile(absPath, {
        root,
        filter,
        ignoreDir
      });
      // 将子目录的结果合并到当前结果中
      results.push(...sub);
      continue;
    }

    // 处理文件条目
    if (entry.isFile()) {
      // 计算相对于根目录的路径，并规范化路径分隔符
      const rel = normalizePath(relative(options.root as string, absPath))

      // 检查文件是否通过过滤器
      if (!options.filter || await options.filter(rel)) {
        // 将符合条件的文件路径添加到结果中
        results.push(rel);
      }
    }
  }

  // 返回所有匹配的文件路径
  return results;
}
