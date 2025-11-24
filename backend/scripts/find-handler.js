#!/usr/bin/env node

/**
 * 快速查找 Command Handler（跨平台）
 * 用法: node scripts/find-handler.js CreateOrderCommand
 */

const fs = require('fs');
const path = require('path');

const commandName = process.argv[2];

if (!commandName) {
  console.log('用法: node scripts/find-handler.js <CommandName>');
  console.log('示例: node scripts/find-handler.js CreateOrderCommand');
  process.exit(1);
}

console.log(`🔍 查找处理 ${commandName} 的 Handler...\n`);

const searchDirs = ['apps', 'libs'];
const pattern = `@CommandHandler(${commandName})`;
let found = false;

function searchInDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        searchInDirectory(filePath);
      }
    } else if (file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (line.includes(pattern)) {
          found = true;
          console.log('✅ 找到 Handler:');
          console.log(`   文件: ${filePath}`);
          console.log(`   行号: ${index + 1}\n`);

          // 查找类名
          for (let i = index; i < Math.min(index + 5, lines.length); i++) {
            if (lines[i].includes('class ')) {
              const match = lines[i].match(/class\s+(\w+)/);
              if (match) {
                console.log(`   类名: ${match[1]}\n`);
              }
              break;
            }
          }

          console.log('📝 打开文件:');
          console.log(`   code ${filePath}:${index + 1}\n`);
        }
      });
    }
  });
}

searchDirs.forEach(searchInDirectory);

if (!found) {
  console.log(`❌ 未找到处理 ${commandName} 的 Handler\n`);
  console.log('💡 可能的原因:');
  console.log('   1. Handler 还未创建');
  console.log('   2. 命令名拼写错误');
  console.log('   3. Handler 没有使用 @CommandHandler 装饰器');
}

