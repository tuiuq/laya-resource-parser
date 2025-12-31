# Laya资源解析器 (Laya Resource Parser)

一个模块化、可扩展的Laya项目资源解析工具，用于分析和处理Laya项目中的资源依赖关系。

## 特性

- 🏗️ **模块化设计**：清晰的模块边界，易于维护和扩展
- ⚡ **高性能**：支持并发处理，优化资源下载和解析
- 🔧 **可配置**：支持多种配置方式（文件、环境变量、命令行参数）
- 📊 **详细日志**：多级别日志记录，支持控制台和文件输出
- 🔌 **插件系统**：支持自定义处理器、解析器和插件
- 🛡️ **错误处理**：完善的错误处理和恢复机制
- 📦 **类型安全**：完整的TypeScript类型定义

## 安装

```bash
# 使用npm
npm install @tuiuq/laya-resource-parser

# 使用yarn
yarn add @tuiuq/laya-resource-parser

# 使用pnpm
pnpm add @tuiuq/laya-resource-parser
```

## 快速开始

### 命令行使用

```bash
# 基本用法
lr parse --base ./src --remote http://example.com/assets

# 使用配置文件
lr parse --config ./laya-config.yaml

# 启用调试模式
lr parse --base ./src --remote http://example.com/assets --debug

# 查看帮助
lr --help
```

### 编程方式使用

```typescript
import { createResourceManager } from '@tuiuq/laya-resource-parser';

async function parseResources() {
  const resourceManager = createResourceManager({
    base: './src',
    remote: 'http://example.com/assets',
    concurrency: 5,
    debug: false
  });

  const result = await resourceManager.parse();
  
  console.log(`处理完成: ${result.successFiles}/${result.totalFiles} 个文件`);
  console.log('文件列表:', result.fileList);
}
```

## 模块架构

```
src/
├── core/                    # 核心模块
│   ├── ResourceManager.ts   # 资源管理器
│   └── index.ts            # 核心模块导出
├── config/                  # 配置模块
│   ├── ConfigManager.ts    # 配置管理器
│   ├── defaults.ts         # 默认配置
│   └── index.ts            # 配置模块导出
├── processors/             # 处理器模块
│   ├── ProcessorFactory.ts # 处理器工厂
│   ├── JsonProcessor.ts    # JSON处理器
│   └── index.ts            # 处理器模块导出
├── downloaders/            # 下载器模块
│   ├── DownloadManager.ts  # 下载管理器
│   └── index.ts            # 下载器模块导出
├── resolvers/              # 解析器模块
│   ├── PathResolver.ts     # 路径解析器
│   └── index.ts            # 解析器模块导出
├── logger/                 # 日志模块
│   ├── Logger.ts           # 日志器
│   └── index.ts            # 日志模块导出
├── utils/                  # 工具模块
│   ├── file/              # 文件工具
│   ├── path/              # 路径工具
│   └── index.ts           # 工具模块导出
├── types/                  # 类型定义
│   ├── core.ts            # 核心类型
│   ├── config.ts          # 配置类型
│   └── index.ts           # 类型模块导出
├── cli/                    # CLI模块
│   └── index.ts           # CLI入口
└── index.ts               # 主入口
```

## 配置系统

### 配置文件示例 (YAML)

```yaml
# laya-config.yaml
resource:
  concurrency: 5
  topLevelHierarchyExtensions: [.ls, .lh]
  parsableHierarchyExtensions: [.ls, .lh, .lmat, .ltc]
  maxDepth: 10
  timeout: 30000
  enableCache: true

logger:
  level: info
  enableColors: true
  enableFileLogging: false

downloader:
  timeout: 15000
  maxRetries: 3
  headers:
    Accept: "*/*"
```

### 配置加载顺序

1. **默认配置** - 内置的合理默认值
2. **配置文件** - `laya-config.yaml` 或 `laya-config.json`
3. **环境变量** - 以 `LAYA_` 为前缀的环境变量
4. **命令行参数** - 命令行传递的参数

### 环境变量示例

```bash
export LAYA_RESOURCE_CONCURRENCY=10
export LAYA_LOGGER_LEVEL=debug
export LAYA_DOWNLOADER_TIMEOUT=20000
```

## API 参考

### 核心类

#### ResourceManager

资源管理器，主入口类。

```typescript
import { createResourceManager } from '@tuiuq/laya-resource-parser';

const manager = createResourceManager(options);
const result = await manager.parse();
```

#### ConfigManager

配置管理器，用于加载和管理配置。

```typescript
import { createConfigManager } from '@tuiuq/laya-resource-parser';

const configManager = createConfigManager({
  configPath: './laya-config.yaml',
  validate: true
});

const config = configManager.getConfig();
```

#### Logger

日志器，提供多级别日志记录。

```typescript
import { createLogger } from '@tuiuq/laya-resource-parser';

const logger = createLogger('MyModule', {
  level: 'debug',
  enableColors: true
});

logger.info('信息日志');
logger.error('错误日志', error);
```

### 类型定义

完整的TypeScript类型定义位于 `src/types/` 目录：

- `core.ts` - 核心类型（ResourceManagerOptions, ResourceProcessResult等）
- `config.ts` - 配置类型（AppConfig, ResourceConfig, LoggerConfig等）
- `processor.ts` - 处理器类型（IFileProcessor, FileProcessResult等）

## 扩展系统

### 自定义处理器

```typescript
// custom-processors/MyProcessor.ts
import type { IFileProcessor, FileProcessingContext, FileProcessResult } from '@tuiuq/laya-resource-parser';

export class MyProcessor implements IFileProcessor {
  async process(filePath: string, context: FileProcessingContext): Promise<FileProcessResult> {
    // 自定义处理逻辑
  }
  
  supports(filePath: string): boolean {
    return filePath.endsWith('.myext');
  }
  
  getName(): string {
    return 'MyProcessor';
  }
  
  getSupportedExtensions(): string[] {
    return ['.myext'];
  }
}
```

### 配置文件注册

```yaml
# laya-config.yaml
processors:
  - name: my-processor
    supportedExtensions: [.myext]
    processorClass: ./custom-processors/MyProcessor.js
    options:
      customOption: value
```

### 自定义插件

```typescript
// plugins/StatsPlugin.ts
export class StatsPlugin {
  constructor(options: any) {
    // 初始化
  }
  
  async beforeParse() {
    // 解析前执行
  }
  
  async afterParse(result: any) {
    // 解析后执行
  }
}
```

## 命令行工具

### 命令列表

```bash
# 解析资源
lr parse --base <path> --remote <url>

# 管理配置
lr config --init                    # 初始化配置文件
lr config --validate <path>        # 验证配置文件
lr config --show                   # 显示当前配置

# 工具命令
lr utils --clear-cache             # 清空缓存
lr utils --stats                   # 显示统计信息

# 帮助
lr --help                          # 显示帮助信息
lr <command> --help               # 显示命令帮助
```

### 命令行选项

| 选项 | 缩写 | 描述 | 默认值 |
|------|------|------|--------|
| `--base` | `-b` | 基础路径 | `./src` |
| `--remote` | `-r` | 远程URL | (必需) |
| `--concurrency` | `-c` | 并发数 | `5` |
| `--debug` | `-d` | 调试模式 | `false` |
| `--config` | | 配置文件路径 | |
| `--output` | | 输出格式 | `text` |
| `--timeout` | | 超时时间(ms) | `30000` |
| `--retry` | | 重试次数 | `3` |
| `--no-cache` | | 禁用缓存 | `false` |

## 示例

查看 `examples/` 目录获取完整示例：

- `basic-usage.ts` - 基本使用示例
- 更多示例待添加...

## 开发

### 构建项目

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm run watch

# 构建项目
pnpm run build

# 生产构建（压缩）
pnpm run build:prod
```

### 运行测试

```bash
# 运行测试（待实现）
pnpm test

# 运行特定测试
pnpm test -- --grep "resource manager"
```

### 代码规范

- 使用 TypeScript 编写
- 遵循 ESLint 规则
- 使用 Prettier 格式化
- 编写完整的类型定义
- 添加必要的注释和文档

## 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md) 了解如何参与项目开发。

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

- 问题反馈: [GitHub Issues](https://github.com/yourusername/laya-resource-parser/issues)
- 功能请求: [GitHub Discussions](https://github.com/yourusername/laya-resource-parser/discussions)
- 文档: [GitHub Wiki](https://github.com/yourusername/laya-resource-parser/wiki)

## 版本历史

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

---

**注意**: 本项目正在积极开发中，API 可能会有变动。建议在生产环境中使用时锁定版本。