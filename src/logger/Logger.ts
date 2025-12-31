/**
 * 增强的日志器
 */

import type { LoggerConfig } from '../types/config';
import { DEFAULT_LOGGER_CONFIG } from '../config/defaults';

/**
 * 日志级别
 */
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
  SILENT = 'silent'
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  caller?: string;
  data?: any;
  error?: Error;
}

/**
 * 日志格式化器接口
 */
export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * 日志处理器接口
 */
export interface LogHandler {
  handle(entry: LogEntry): void;
}

/**
 * 增强的日志器类
 */
export class Logger {
  private config: LoggerConfig;
  private formatter: LogFormatter;
  private handlers: LogHandler[] = [];
  private buffer: LogEntry[] = [];
  private isBuffering: boolean = false;
  private bufferSize: number = 100;
  private childLoggers: Map<string, Logger> = new Map();

  constructor(
    private readonly name: string = 'Logger',
    config?: Partial<LoggerConfig>
  ) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.formatter = new DefaultLogFormatter(this.config);
    this.setupHandlers();
  }

  /**
   * 设置日志处理器
   */
  private setupHandlers(): void {
    // 控制台处理器
    if (this.config.enableColors !== false) {
      this.handlers.push(new ConsoleLogHandler(this.config));
    } else {
      this.handlers.push(new PlainConsoleLogHandler());
    }

    // 文件处理器
    if (this.config.enableFileLogging && this.config.logFile) {
      this.handlers.push(new FileLogHandler(this.config));
    }
  }

  /**
   * 记录错误日志
   */
  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, args);
  }

  /**
   * 记录警告日志
   */
  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, args);
  }

  /**
   * 记录信息日志
   */
  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, args);
  }

  /**
   * 记录调试日志
   */
  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, args);
  }

  /**
   * 记录跟踪日志
   */
  public trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, message, args);
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, args: any[]): void {
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }

    // 提取错误和数据
    let error: Error | undefined;
    let data: any = {};
    const caller = this.config.showCaller ? this.getCaller() : '';

    for (const arg of args) {
      if (arg instanceof Error) {
        error = arg;
      } else if (typeof arg === 'object' && arg !== null) {
        data = { ...data, ...arg };
      } else if (arg !== undefined) {
        data = { ...data, value: arg };
      }
    }

    // 创建日志条目
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message: this.formatMessage(message, data),
      caller,
      data: Object.keys(data).length > 0 ? data : undefined,
      error
    };

    // 处理日志条目
    this.processEntry(entry);
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4,
      silent: 5
    };

    const currentLevel = levels[this.config.level];
    const targetLevel = levels[level];

    return targetLevel <= currentLevel;
  }

  /**
   * 格式化消息
   */
  private formatMessage(message: string, data: any): string {
    if (Object.keys(data).length === 0) {
      return message;
    }

    // 替换模板变量
    let formatted = message;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      if (formatted.includes(placeholder)) {
        formatted = formatted.replace(placeholder, String(value));
      }
    }

    return formatted;
  }

  /**
   * 获取调用者信息
   */
  private getCaller(): string {
    const error = new Error();
    const stack = error.stack?.split('\n') || [];
    
    // 跳过前3行：Error、Logger.log、Logger.[method]
    if (stack.length > 3) {
      const callerLine = stack[3]?.trim() || '';
      // 提取函数名和位置
      const match = callerLine.match(/at\s+(.+?)\s+\((.+?)\)/);
      if (match) {
        return `${match[1]} (${match[2]})`;
      }
    }
    
    return 'unknown';
  }

  /**
   * 处理日志条目
   */
  private processEntry(entry: LogEntry): void {
    // 缓冲处理
    if (this.isBuffering) {
      this.buffer.push(entry);
      if (this.buffer.length >= this.bufferSize) {
        this.flushBuffer();
      }
      return;
    }

    // 直接处理
    this.handleEntry(entry);
  }

  /**
   * 处理单个日志条目
   */
  private handleEntry(entry: LogEntry): void {
    const formatted = this.formatter.format(entry);
    
    for (const handler of this.handlers) {
      try {
        handler.handle({ ...entry, message: formatted });
      } catch (error) {
        // 避免无限循环，使用控制台输出错误
        console.error('日志处理器错误:', error);
      }
    }
  }

  /**
   * 开始缓冲日志
   */
  public startBuffering(size: number = 100): void {
    this.isBuffering = true;
    this.bufferSize = size;
    this.buffer = [];
  }

  /**
   * 停止缓冲并刷新
   */
  public stopBuffering(): LogEntry[] {
    this.isBuffering = false;
    const flushed = [...this.buffer];
    this.flushBuffer();
    return flushed;
  }

  /**
   * 刷新缓冲区
   */
  private flushBuffer(): void {
    for (const entry of this.buffer) {
      this.handleEntry(entry);
    }
    this.buffer = [];
  }

  /**
   * 创建子日志器
   */
  public createChildLogger(name: string): Logger {
    if (!this.childLoggers.has(name)) {
      const childLogger = new Logger(`${this.name}:${name}`, this.config);
      this.childLoggers.set(name, childLogger);
    }
    return this.childLoggers.get(name)!;
  }

  /**
   * 获取子日志器
   */
  public getChildLogger(name: string): Logger | undefined {
    return this.childLoggers.get(name);
  }

  /**
   * 设置日志级别
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 获取日志级别
   */
  public getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 启用/禁用颜色
   */
  public setColors(enabled: boolean): void {
    this.config.enableColors = enabled;
    this.setupHandlers(); // 重新设置处理器
  }

  /**
   * 启用/禁用文件日志
   */
  public setFileLogging(enabled: boolean, logFile?: string): void {
    this.config.enableFileLogging = enabled;
    if (logFile) {
      this.config.logFile = logFile;
    }
    this.setupHandlers(); // 重新设置处理器
  }

  /**
   * 获取所有日志条目（如果启用了缓冲区）
   */
  public getBufferedEntries(): LogEntry[] {
    return [...this.buffer];
  }

  /**
   * 清空缓冲区
   */
  public clearBuffer(): void {
    this.buffer = [];
  }

  /**
   * 添加自定义处理器
   */
  public addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  /**
   * 移除处理器
   */
  public removeHandler(handler: LogHandler): boolean {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 设置自定义格式化器
   */
  public setFormatter(formatter: LogFormatter): void {
    this.formatter = formatter;
  }

  /**
   * 获取日志器名称
   */
  public getName(): string {
    return this.name;
  }

  /**
   * 获取配置
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * 默认日志格式化器
 */
class DefaultLogFormatter implements LogFormatter {
  constructor(private readonly config: LoggerConfig) {}

  public format(entry: LogEntry): string {
    const parts: string[] = [];

    // 时间戳
    if (this.config.showTimestamp) {
      parts.push(`[${entry.timestamp.toISOString()}]`);
    }

    // 日志级别
    if (this.config.showLevel) {
      const levelStr = entry.level.toUpperCase().padEnd(5);
      parts.push(`[${levelStr}]`);
    }

    // 调用者信息
    if (this.config.showCaller && entry.caller) {
      parts.push(`[${entry.caller}]`);
    }

    // 消息
    parts.push(entry.message);

    // 错误信息
    if (entry.error) {
      parts.push(`\nError: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`Stack: ${entry.error.stack}`);
      }
    }

    // 附加数据
    if (entry.data && Object.keys(entry.data).length > 0) {
      parts.push(`\nData: ${JSON.stringify(entry.data, null, 2)}`);
    }

    return parts.join(' ');
  }
}

/**
 * 控制台日志处理器（带颜色）
 */
class ConsoleLogHandler implements LogHandler {
  private readonly colors = {
    error: '\x1b[31m', // 红色
    warn: '\x1b[33m',  // 黄色
    info: '\x1b[32m',  // 绿色
    debug: '\x1b[36m', // 青色
    trace: '\x1b[90m', // 灰色
    reset: '\x1b[0m'   // 重置
  };

  constructor(_config: LoggerConfig) {}

  public handle(entry: LogEntry): void {
    const color = this.colors[entry.level as keyof typeof this.colors] || this.colors.reset;
    const reset = this.colors.reset;
    
    console.log(`${color}${entry.message}${reset}`);
    
    // 输出错误堆栈
    if (entry.error && entry.level === 'error') {
      console.error(entry.error);
    }
  }
}

/**
 * 普通控制台日志处理器（无颜色）
 */
class PlainConsoleLogHandler implements LogHandler {
  public handle(entry: LogEntry): void {
    console.log(entry.message);
    
    // 输出错误堆栈
    if (entry.error && entry.level === 'error') {
      console.error(entry.error);
    }
  }
}

/**
 * 文件日志处理器
 */
class FileLogHandler implements LogHandler {
  private fs: typeof import('fs');
  private path: typeof import('path');
  private logStream?: import('fs').WriteStream;

  constructor(private readonly config: LoggerConfig) {
    this.fs = require('fs');
    this.path = require('path');
    this.ensureLogFile();
  }

  private ensureLogFile(): void {
    if (!this.config.logFile) {
      return;
    }

    try {
      const logDir = this.path.dirname(this.config.logFile);
      if (!this.fs.existsSync(logDir)) {
        this.fs.mkdirSync(logDir, { recursive: true });
      }

      this.logStream = this.fs.createWriteStream(this.config.logFile, {
        flags: 'a',
        encoding: 'utf-8'
      });
    } catch (error) {
      console.error('创建日志文件失败:', error);
    }
  }

  public handle(entry: LogEntry): void {
    if (!this.logStream) {
      return;
    }

    try {
      this.logStream.write(entry.message + '\n');
      
      // 写入错误堆栈
      if (entry.error) {
        this.logStream.write(`Error: ${entry.error.message}\n`);
        if (entry.error.stack) {
          this.logStream.write(`Stack: ${entry.error.stack}\n`);
        }
      }
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  public close(): void {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}