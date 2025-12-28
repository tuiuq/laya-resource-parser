import chalk, { type ChalkInstance } from "chalk";
import type { ILogger } from "./interface";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger implements ILogger {
  constructor(
    private readonly prefix: string = "ResourceManager",
    private readonly level: LogLevel = LogLevel.INFO,
    private readonly enableColors: boolean = true,
    private readonly output: NodeJS.WritableStream = process.stdout,
    private readonly errorOutput: NodeJS.WritableStream = process.stderr
  ) {}

  private formatMessage(
    level: string,
    emoji: string,
    message: string,
    color: ChalkInstance
  ): string {
    const timestamp = this.getDate();
    const levelTag = this.enableColors
      ? chalk.bgHex(this.getColor(level)).bold(` ${level} `)
      : `[${level}]`;

    const prefix = this.enableColors
      ? color(`[${this.prefix}]`)
      : `[${this.prefix}]`

    return `${timestamp} ${levelTag} ${prefix} ${emoji} ${message}`
  }

  private getColor(level: string): string {
    const colors = {
      'Info': '#00ff00',
      'Debug': '#0000ff',
      'Error': '#ff0000',
      'Warn': '#ffff00'
    };
    return colors[level as keyof typeof colors] || "#ffffff"
  }

  public info(message: string, ...args: unknown[]) {
    if (this.level < LogLevel.INFO) return;

    const formatted = this.formatMessage("Info", "ℹ️ ", message, chalk.green);
    console.info(formatted, ...args);
  }

  public error(message: string, ...args: unknown[]) {
    if (this.level < LogLevel.ERROR) return;

    const formatted = this.formatMessage("Error", "❌", message, chalk.red);
    console.error(formatted, ...args);
  }

  public debug(message: string, ...args: unknown[]) {
    if (this.level < LogLevel.DEBUG) return;

    const formatted = this.formatMessage("Debug", "🔍", message, chalk.blue);
    console.debug(formatted, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.level < LogLevel.WARN) return;

    const formatted = this.formatMessage("Warn", "⚠️ ", message, chalk.yellow);
    console.warn(formatted, ...args);
  }

  private getDate(): string {
    return chalk.cyan(`[${new Date().toLocaleTimeString("zh-CN")}]`);
  }

  public createChildLogger(prefix: string): Logger {
    return new Logger(`${this.prefix}:${prefix}`, this.level, this.enableColors, this.output, this.errorOutput);
  }
}
