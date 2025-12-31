/**
 * Laya资源解析器 - 基本使用示例
 */

import { createResourceManager, createConfigManager, createLogger } from '../src/index';

/**
 * 示例1: 基本使用
 */
async function exampleBasicUsage() {
  console.log('=== 示例1: 基本使用 ===\n');

  // 创建资源管理器
  const resourceManager = createResourceManager({
    base: './src', // 基础路径
    remote: 'http://example.com/assets', // 远程资源URL
    concurrency: 5, // 并发数
    debug: false // 调试模式
  });

  // 添加事件监听器
  resourceManager.on('file_started', (event) => {
    console.log(`开始处理文件: ${event.data.filePath}`);
  });

  resourceManager.on('file_completed', (event) => {
    console.log(`完成处理文件: ${event.data.context.filePath}`);
  });

  resourceManager.on('complete', (event) => {
    console.log('\n资源解析完成!');
    console.log(`总文件数: ${event.data.totalFiles}`);
    console.log(`成功处理: ${event.data.successFiles}`);
    console.log(`失败处理: ${event.data.failedFiles}`);
  });

  // 开始解析
  try {
    const result = await resourceManager.parse();
    
    // 输出结果
    console.log('\n=== 解析结果 ===');
    console.log('文件列表:');
    result.fileList.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    if (result.errors.length > 0) {
      console.log('\n错误列表:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.filePath}: ${error.error.message}`);
      });
    }
  } catch (error) {
    console.error('解析失败:', error);
  }
}

/**
 * 示例2: 使用配置文件
 */
async function exampleWithConfig() {
  console.log('\n\n=== 示例2: 使用配置文件 ===\n');

  // 创建配置管理器
  const configManager = createConfigManager({
    configPath: './laya-config.yaml', // 配置文件路径
    mergeDefaults: true, // 合并默认配置
    validate: true // 验证配置
  });

  // 获取配置
  const config = configManager.getConfig();
  console.log('当前配置:');
  console.log(JSON.stringify(config, null, 2));

  // 创建资源管理器（使用配置）
  const resourceManager = createResourceManager({
    base: './src',
    remote: 'http://example.com/assets',
    config: config.resource // 使用配置文件中的资源配置
  });

  // 创建日志器（使用配置）
  const logger = createLogger('Example', config.logger);
  logger.info('使用配置文件示例开始');

  try {
    const result = await resourceManager.parse();
    logger.info('解析完成', {
      totalFiles: result.totalFiles,
      successFiles: result.successFiles
    });
  } catch (error) {
    logger.error('解析失败', error);
  }
}

/**
 * 示例3: 高级功能
 */
async function exampleAdvancedFeatures() {
  console.log('\n\n=== 示例3: 高级功能 ===\n');

  const resourceManager = createResourceManager({
    base: './src',
    remote: 'http://example.com/assets',
    concurrency: 3,
    debug: true
  });

  // 获取处理状态
  console.log('初始状态:', resourceManager.getStatus());

  // 开始解析（异步）
  const parsePromise = resourceManager.parse();

  // 定时检查进度
  const progressInterval = setInterval(() => {
    const status = resourceManager.getStatus();
    const progress = resourceManager.getProgress();
    
    console.log(`进度: ${progress.toFixed(1)}%`);
    console.log(`已处理: ${status.processedCount}/${status.totalCount}`);
    
    if (!status.isProcessing) {
      clearInterval(progressInterval);
    }
  }, 1000);

  try {
    const result = await parsePromise;
    
    // 获取处理上下文
    const contexts = resourceManager.getProcessingContexts();
    console.log('\n处理上下文:');
    contexts.forEach(context => {
      console.log(`  ${context.filePath}: ${context.status}`);
    });
    
    // 获取顶层文件
    const topLevelFiles = resourceManager.getTopLevelFiles();
    console.log('\n顶层文件:');
    topLevelFiles.forEach(file => console.log(`  - ${file}`));
    
  } catch (error) {
    console.error('解析失败:', error);
  } finally {
    clearInterval(progressInterval);
  }
}

/**
 * 示例4: 错误处理
 */
async function exampleErrorHandling() {
  console.log('\n\n=== 示例4: 错误处理 ===\n');

  const resourceManager = createResourceManager({
    base: './invalid-path', // 无效的路径
    remote: 'http://example.com/assets',
    concurrency: 1
  });

  try {
    await resourceManager.parse();
  } catch (error) {
    if (error instanceof Error) {
      console.log('错误类型:', error.constructor.name);
      console.log('错误消息:', error.message);
      
      if ('code' in error) {
        console.log('错误代码:', (error as any).code);
      }
      
      if ('filePath' in error) {
        console.log('相关文件:', (error as any).filePath);
      }
    } else {
      console.log('未知错误:', error);
    }
  }
}

/**
 * 示例5: 自定义处理器
 */
async function exampleCustomProcessor() {
  console.log('\n\n=== 示例5: 自定义处理器 ===\n');

  // 创建配置管理器
  const configManager = createConfigManager();
  
  // 更新配置，添加自定义处理器
  configManager.updateConfig({
    processors: [
      {
        name: 'custom-json',
        supportedExtensions: ['.json', '.ls', '.lh'],
        processorClass: './custom-processors/JsonProcessor.js',
        options: {
          strictMode: true,
          allowComments: false
        }
      }
    ]
  });

  const config = configManager.getConfig();
  console.log('更新后的配置:');
  console.log(JSON.stringify(config.processors, null, 2));

  // 注意：实际使用时需要创建对应的自定义处理器文件
  console.log('\n注意：需要创建 ./custom-processors/JsonProcessor.js 文件');
}

/**
 * 主函数
 */
async function main() {
  console.log('Laya资源解析器 - 使用示例\n');
  console.log('='.repeat(50));

  try {
    // 运行示例
    await exampleBasicUsage();
    await exampleWithConfig();
    await exampleAdvancedFeatures();
    await exampleErrorHandling();
    await exampleCustomProcessor();
    
    console.log('\n' + '='.repeat(50));
    console.log('所有示例执行完成!');
  } catch (error) {
    console.error('示例执行失败:', error);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

// 导出示例函数
export {
  exampleBasicUsage,
  exampleWithConfig,
  exampleAdvancedFeatures,
  exampleErrorHandling,
  exampleCustomProcessor,
  main
};