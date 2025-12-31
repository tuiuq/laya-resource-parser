/**
 * 配置管理器
 */

import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import stripJsonComments from 'strip-json-comments';
import type {
  AppConfig,
  ResourceConfig,
  LoggerConfig,
  DownloaderConfig,
  ConfigLoadOptions,
  ConfigValidationResult
} from '../types/config';
import {
  DEFAULT_APP_CONFIG,
  getDefaultConfig,
  mergeConfigs
} from './defaults';

/**
 * 配置管理器类
 */
export class ConfigManager {
  private config: AppConfig;
  private configPath?: string;
  private validationErrors: string[] = [];
  private validationWarnings: string[] = [];

  constructor(options?: ConfigLoadOptions) {
    const {
      configPath,
      mergeDefaults = true,
      validate = true,
      envPrefix = 'LAYA_',
      cliArgs = {}
    } = options || {};

    this.configPath = configPath;
    
    // 加载配置
    this.config = this.loadConfig({
      configPath,
      mergeDefaults,
      envPrefix,
      cliArgs
    });

    // 验证配置
    if (validate) {
      const validationResult = this.validateConfig(this.config);
      if (!validationResult.valid && validationResult.errors) {
        this.validationErrors = validationResult.errors;
        if (validationResult.errors.length > 0) {
          throw new Error(`配置验证失败:\n${validationResult.errors.join('\n')}`);
        }
      }
      if (validationResult.warnings) {
        this.validationWarnings = validationResult.warnings;
      }
    }
  }

  /**
   * 加载配置
   */
  private loadConfig(options: {
    configPath?: string;
    mergeDefaults: boolean;
    envPrefix: string;
    cliArgs: Record<string, any>;
  }): AppConfig {
    let loadedConfig: Partial<AppConfig> = {};

    // 1. 从配置文件加载
    if (options.configPath) {
      loadedConfig = this.loadFromFile(options.configPath);
    } else {
      // 尝试从默认位置加载
      const defaultPaths = [
        'laya-config.json',
        'laya-config.yaml',
        'laya-config.yml',
        '.laya/config.json',
        '.laya/config.yaml',
        '.laya/config.yml'
      ];

      for (const path of defaultPaths) {
        if (existsSync(path)) {
          loadedConfig = this.loadFromFile(path);
          this.configPath = path;
          break;
        }
      }
    }

    // 2. 从环境变量加载
    const envConfig = this.loadFromEnv(options.envPrefix);
    loadedConfig = mergeConfigs(loadedConfig, envConfig);

    // 3. 从命令行参数加载
    loadedConfig = mergeConfigs(loadedConfig, this.normalizeCliArgs(options.cliArgs));

    // 4. 合并默认配置
    if (options.mergeDefaults) {
      const defaultConfig = getDefaultConfig();
      return mergeConfigs(defaultConfig, loadedConfig);
    }

    return loadedConfig as AppConfig;
  }

  /**
   * 从文件加载配置
   */
  private loadFromFile(filePath: string): Partial<AppConfig> {
    try {
      if (!existsSync(filePath)) {
        throw new Error(`配置文件不存在: ${filePath}`);
      }

      const content = readFileSync(filePath, 'utf-8');
      let parsed: any;

      if (filePath.endsWith('.json')) {
        // 移除JSON注释并解析
        const jsonWithoutComments = stripJsonComments(content);
        parsed = JSON.parse(jsonWithoutComments);
      } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        parsed = parseYaml(content);
      } else {
        throw new Error(`不支持的配置文件格式: ${filePath}`);
      }

      return this.normalizeConfig(parsed);
    } catch (error) {
      throw new Error(`加载配置文件失败: ${filePath}\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnv(prefix: string): Partial<AppConfig> {
    const envConfig: Partial<AppConfig> = {};
    const prefixUpper = prefix.toUpperCase();

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefixUpper)) {
        const configKey = key.slice(prefixUpper.length).toLowerCase();
        this.setNestedValue(envConfig, configKey, value);
      }
    }

    return envConfig;
  }

  /**
   * 规范化命令行参数
   */
  private normalizeCliArgs(cliArgs: Record<string, any>): Partial<AppConfig> {
    const normalized: Partial<AppConfig> = {};

    // 映射命令行参数到配置结构
    const argMappings: Record<string, string> = {
      'base': 'resource.base',
      'remote': 'resource.remote',
      'concurrency': 'resource.concurrency',
      'debug': 'logger.level',
      'cache': 'resource.enableCache',
      'timeout': 'resource.timeout',
      'retry': 'resource.retryCount'
    };

    for (const [argKey, argValue] of Object.entries(cliArgs)) {
      const configPath = argMappings[argKey];
      if (configPath) {
        this.setNestedValue(normalized, configPath, argValue);
      }
    }

    // 特殊处理debug参数
    if (cliArgs.debug !== undefined) {
      if (!normalized.logger) {
        normalized.logger = {};
      }
      (normalized.logger as any).level = cliArgs.debug ? 'debug' : 'info';
    }

    return normalized;
  }

  /**
   * 规范化配置对象
   */
  private normalizeConfig(config: any): Partial<AppConfig> {
    const normalized: Partial<AppConfig> = {};

    // 处理资源配置
    if (config.resource || config.concurrency) {
      normalized.resource = {
        ...(config.resource || {}),
        ...(config.concurrency !== undefined ? { concurrency: config.concurrency } : {})
      };
    }

    // 处理日志配置
    if (config.logger || config.logLevel) {
      normalized.logger = {
        ...(config.logger || {}),
        ...(config.logLevel !== undefined ? { level: config.logLevel } : {})
      };
    }

    // 处理下载器配置
    if (config.downloader) {
      normalized.downloader = config.downloader;
    }

    // 处理处理器配置
    if (config.processors) {
      normalized.processors = config.processors;
    }

    // 处理解析器配置
    if (config.resolvers) {
      normalized.resolvers = config.resolvers;
    }

    // 处理插件配置
    if (config.plugins) {
      normalized.plugins = config.plugins;
    }

    // 处理扩展配置
    if (config.extensions) {
      normalized.extensions = config.extensions;
    }

    return normalized;
  }

  /**
   * 设置嵌套属性值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    const lastKey = keys[keys.length - 1];
    
    // 尝试转换值类型
    const typedValue = this.convertValueType(value);
    current[lastKey] = typedValue;
  }

  /**
   * 转换值类型
   */
  private convertValueType(value: string): any {
    // 尝试解析为数字
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    // 尝试解析为浮点数
    if (/^\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }

    // 尝试解析为布尔值
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }

    // 尝试解析为数组
    if (value.includes(',')) {
      return value.split(',').map(item => item.trim());
    }

    // 返回原始字符串
    return value;
  }

  /**
   * 验证配置
   */
  public validateConfig(config: AppConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证资源配置
    if (config.resource) {
      this.validateResourceConfig(config.resource, errors, warnings);
    }

    // 验证日志配置
    if (config.logger) {
      this.validateLoggerConfig(config.logger, errors, warnings);
    }

    // 验证下载器配置
    if (config.downloader) {
      this.validateDownloaderConfig(config.downloader, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * 验证资源配置
   */
  private validateResourceConfig(
    config: ResourceConfig,
    errors: string[],
    warnings: string[]
  ): void {
    if (config.concurrency < 1 || config.concurrency > 50) {
      errors.push(`并发数必须在1-50之间，当前值: ${config.concurrency}`);
    }

    if (config.maxDepth !== undefined && config.maxDepth < 0) {
      errors.push(`最大深度不能为负数，当前值: ${config.maxDepth}`);
    }

    if (config.timeout !== undefined && config.timeout < 0) {
      errors.push(`超时时间不能为负数，当前值: ${config.timeout}`);
    }

    if (config.retryCount !== undefined && config.retryCount < 0) {
      errors.push(`重试次数不能为负数，当前值: ${config.retryCount}`);
    }

    if (config.retryDelay !== undefined && config.retryDelay < 0) {
      errors.push(`重试延迟不能为负数，当前值: ${config.retryDelay}`);
    }

    if (config.topLevelHierarchyExtensions.length === 0) {
      warnings.push('顶层文件扩展名列表为空，可能无法找到顶层文件');
    }

    if (config.parsableHierarchyExtensions.length === 0) {
      warnings.push('可解析文件扩展名列表为空，可能无法解析任何文件');
    }
  }

  /**
   * 验证日志配置
   */
  private validateLoggerConfig(
    config: LoggerConfig,
    errors: string[],
    warnings: string[]
  ): void {
    const validLevels = ['error', 'warn', 'info', 'debug', 'trace', 'silent'];
    if (!validLevels.includes(config.level)) {
      errors.push(`无效的日志级别: ${config.level}，有效值: ${validLevels.join(', ')}`);
    }

    if (config.enableFileLogging && !config.logFile) {
      errors.push('启用文件日志记录但未指定日志文件路径');
    }
  }

  /**
   * 验证下载器配置
   */
  private validateDownloaderConfig(
    config: DownloaderConfig,
    errors: string[],
    warnings: string[]
  ): void {
    if (config.timeout !== undefined && config.timeout < 0) {
      errors.push(`下载器超时时间不能为负数，当前值: ${config.timeout}`);
    }

    if (config.maxRetries !== undefined && config.maxRetries < 0) {
      errors.push(`下载器最大重试次数不能为负数，当前值: ${config.maxRetries}`);
    }

    if (config.retryDelay !== undefined && config.retryDelay < 0) {
      errors.push(`下载器重试延迟不能为负数，当前值: ${config.retryDelay}`);
    }
  }

  /**
   * 获取配置
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * 获取资源配置
   */
  public getResourceConfig(): ResourceConfig {
    return { ...this.config.resource };
  }

  /**
   * 获取日志配置
   */
  public getLoggerConfig(): LoggerConfig {
    return { ...this.config.logger! };
  }

  /**
   * 获取下载器配置
   */
  public getDownloaderConfig(): DownloaderConfig {
    return { ...this.config.downloader! };
  }

  /**
   * 更新配置
   */
  public updateConfig(updates: Partial<AppConfig>): void {
    this.config = mergeConfigs(this.config, updates);
    const validationResult = this.validateConfig(this.config);
    if (!validationResult.valid && validationResult.errors) {
      throw new Error(`配置更新失败:\n${validationResult.errors.join('\n')}`);
    }
  }

  /**
   * 获取配置路径
   */
  public getConfigPath(): string | undefined {
    return this.configPath;
  }

  /**
   * 获取验证错误
   */
  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  /**
   * 获取验证警告
   */
  public getValidationWarnings(): string[] {
    return [...this.validationWarnings];
  }

  /**
   * 检查是否有验证错误
   */
  public hasValidationErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  /**
   * 检查是否有验证警告
   */
  public hasValidationWarnings(): boolean {
    return this.validationWarnings.length > 0;
  }

  /**
   * 重新加载配置
   */
  public reload(): void {
    if (this.configPath) {
      const newConfig = this.loadFromFile(this.configPath);
      this.config = mergeConfigs(this.config, newConfig);
    }
  }

  /**
   * 导出配置为JSON
   */
  public toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导出配置为YAML
   */
  public toYAML(): string {
    const yaml = require('yaml');
    return yaml.stringify(this.config);
  }
}