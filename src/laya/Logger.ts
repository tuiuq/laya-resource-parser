/**
 * 向后兼容的Logger
 * 
 * 注意：这个类是为了保持向后兼容性而保留的
 * 新的代码应该使用 src/logger/Logger.ts
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
  SILENT = 'silent'
}

/**
 * 日志器接口
 */
export interface ILogger {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  createChildLogger(prefix: string): Logger;
}

/**
 * @deprecated 使用新的 Logger (从 src/logger 导入)
 */
export class Logger implements ILogger {
  constructor(
    private readonly name: string = 'Logger',
    private readonly level: LogLevel = LogLevel.INFO
  ) {
    console.warn('警告: 使用已弃用的Logger，请迁移到新的Logger (从 src/logger 导入)');
  }

  /**
   * 记录信息日志
   */
  public info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] [${this.name}] ${message}`, ...args);
    }
  }

  /**
   * 记录错误日志
   */
  public error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] [${this.name}] ${message}`, ...args);
    }
  }

  /**
   * 记录调试日志
   */
  public debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] [${this.name}] ${message}`, ...args);
    }
  }

  /**
   * 记录警告日志
   */
  public warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] [${this.name}] ${message}`, ...args);
    }
  }

  /**
   * 创建子日志器
   */
  public createChildLogger(prefix: string): Logger {
    return new Logger(`${this.name}:${prefix}`, this.level);
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.DEBUG]: 3,
      [LogLevel.TRACE]: 4,
      [LogLevel.SILENT]: 5
    };

    const currentLevel = levels[this.level];
    const targetLevel = levels[level];

    return targetLevel <= currentLevel;
  }

  /**
   * 设置日志级别
   */
  public setLevel(level: LogLevel): void {
    (this as any).level = level;
  }

  /**
   * 获取日志级别
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * 获取日志器名称
   */
  public getName(): string {
    return this.name;
  }

  /**
   * 创建日志器实例
   */
  public static create(name: string, level: LogLevel = LogLevel.INFO): Logger {
    return new Logger(name, level);
  }
}