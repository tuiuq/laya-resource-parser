/**
 * 处理器类型定义
 */

/**
 * 文件处理器接口
 */
export interface IFileProcessor {
  /**
   * 处理文件
   */
  process(filePath: string, context: FileProcessingContext): Promise<FileProcessResult>;
  
  /**
   * 检查是否支持该文件
   */
  supports(filePath: string): boolean;
  
  /**
   * 获取处理器名称
   */
  getName(): string;
  
  /**
   * 获取支持的扩展名列表
   */
  getSupportedExtensions(): string[];
  
  /**
   * 获取处理器选项
   */
  getOptions(): Record<string, any>;
  
  /**
   * 设置处理器选项
   */
  setOptions(options: Record<string, any>): void;
}

/**
 * 文件处理结果
 */
export interface FileProcessResult {
  /** 是否成功 */
  success: boolean;
  /** 文件路径 */
  filePath: string;
  /** 处理后的数据 */
  data?: any;
  /** 元数据 */
  metadata?: FileMetadata;
  /** 发现的资源引用 */
  references?: ResourceReference[];
  /** 错误信息 */
  error?: Error;
  /** 处理耗时（毫秒） */
  duration: number;
  /** 文件大小（字节） */
  fileSize?: number;
}

/**
 * 文件元数据
 */
export interface FileMetadata {
  /** 文件类型 */
  fileType: string;
  /** 文件扩展名 */
  extension: string;
  /** 文件编码 */
  encoding?: string;
  /** 文件修改时间 */
  modifiedTime?: Date;
  /** 文件创建时间 */
  createdTime?: Date;
  /** 文件哈希值 */
  hash?: string;
  /** 文件属性 */
  attributes?: Record<string, any>;
}

/**
 * 处理器工厂接口
 */
export interface IProcessorFactory {
  /**
   * 创建处理器
   */
  createProcessor(processorType: string, options?: Record<string, any>): IFileProcessor;
  
  /**
   * 注册处理器
   */
  registerProcessor(processorType: string, processorClass: any): void;
  
  /**
   * 注销处理器
   */
  unregisterProcessor(processorType: string): void;
  
  /**
   * 获取所有已注册的处理器类型
   */
  getRegisteredProcessors(): string[];
  
  /**
   * 根据文件路径获取合适的处理器
   */
  getProcessorForFile(filePath: string): IFileProcessor | null;
  
  /**
   * 获取所有支持指定扩展名的处理器
   */
  getProcessorsForExtension(extension: string): IFileProcessor[];
}

/**
 * 处理器中间件
 */
export interface ProcessorMiddleware {
  /**
   * 处理前调用
   */
  beforeProcess?(context: FileProcessingContext): Promise<void> | void;
  
  /**
   * 处理后调用
   */
  afterProcess?(context: FileProcessingContext, result: FileProcessResult): Promise<void> | void;
  
  /**
   * 处理错误时调用
   */
  onError?(context: FileProcessingContext, error: Error): Promise<void> | void;
}

/**
 * 处理器链
 */
export interface ProcessorChain {
  /**
   * 添加处理器
   */
  addProcessor(processor: IFileProcessor): void;
  
  /**
   * 添加中间件
   */
  addMiddleware(middleware: ProcessorMiddleware): void;
  
  /**
   * 处理文件
   */
  process(filePath: string, context: FileProcessingContext): Promise<FileProcessResult>;
  
  /**
   * 清空处理器链
   */
  clear(): void;
  
  /**
   * 获取处理器数量
   */
  getProcessorCount(): number;
  
  /**
   * 获取中间件数量
   */
  getMiddlewareCount(): number;
}

/**
 * 处理器注册信息
 */
export interface ProcessorRegistration {
  /** 处理器类型 */
  type: string;
  /** 处理器类 */
  processorClass: any;
  /** 处理器选项 */
  options?: Record<string, any>;
  /** 支持的扩展名 */
  supportedExtensions: string[];
  /** 处理器优先级（数字越大优先级越高） */
  priority?: number;
  /** 处理器描述 */
  description?: string;
}

/**
 * 处理器上下文
 */
export interface ProcessorContext {
  /** 文件路径 */
  filePath: string;
  /** 原始文件数据 */
  rawData?: Buffer | string;
  /** 解析后的数据 */
  parsedData?: any;
  /** 处理器选项 */
  options: Record<string, any>;
  /** 父处理器（如果有） */
  parentProcessor?: IFileProcessor;
  /** 处理器链 */
  processorChain?: ProcessorChain;
  /** 自定义数据 */
  customData?: Record<string, any>;
}

/**
 * 处理器事件
 */
export interface ProcessorEvent {
  /** 事件类型 */
  type: 'processor_started' | 'processor_completed' | 'processor_failed' | 'processor_skipped';
  /** 处理器名称 */
  processorName: string;
  /** 文件路径 */
  filePath: string;
  /** 事件数据 */
  data?: any;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 处理器事件监听器
 */
export type ProcessorEventListener = (event: ProcessorEvent) => void;

/**
 * 可观察的处理器接口
 */
export interface IObservableFileProcessor extends IFileProcessor {
  /**
   * 添加事件监听器
   */
  on(eventType: string, listener: ProcessorEventListener): void;
  
  /**
   * 移除事件监听器
   */
  off(eventType: string, listener: ProcessorEventListener): void;
  
  /**
   * 触发事件
   */
  emit(event: ProcessorEvent): void;
}

/**
 * 处理器基类选项
 */
export interface BaseProcessorOptions {
  /** 处理器名称 */
  name?: string;
  /** 支持的扩展名 */
  supportedExtensions?: string[];
  /** 处理器优先级 */
  priority?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 处理器描述 */
  description?: string;
  /** 处理器版本 */
  version?: string;
  /** 处理器作者 */
  author?: string;
  /** 处理器许可证 */
  license?: string;
}

/**
 * 处理器加载器接口
 */
export interface IProcessorLoader {
  /**
   * 加载处理器
   */
  loadProcessor(processorPath: string): Promise<IFileProcessor>;
  
  /**
   * 从目录加载所有处理器
   */
  loadProcessorsFromDirectory(directoryPath: string): Promise<IFileProcessor[]>;
  
  /**
   * 从包加载处理器
   */
  loadProcessorsFromPackage(packageName: string): Promise<IFileProcessor[]>;
  
  /**
   * 获取已加载的处理器
   */
  getLoadedProcessors(): IFileProcessor[];
  
  /**
   * 卸载处理器
   */
  unloadProcessor(processorName: string): boolean;
}