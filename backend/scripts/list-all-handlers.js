#!/usr/bin/env node

/**
 * 列出所有的 Command Handlers
 * 用法: node scripts/list-all-handlers.js
 */

const fs = require('fs');
const path = require('path');

console.log('📋 所有 Command Handlers:\n');

const handlers = [];

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
        const match = line.match(/@CommandHandler\((\w+)\)/);
        if (match) {
          const commandName = match[1];
          let className = '';

          // 查找类名
          for (let i = index; i < Math.min(index + 5, lines.length); i++) {
            const classMatch = lines[i].match(/class\s+(\w+)/);
            if (classMatch) {
              className = classMatch[1];
              break;
            }
          }

          handlers.push({
            command: commandName,
            handler: className,
            file: filePath,
            line: index + 1,
          });
        }
      });
    }
  });
}

['apps', 'libs'].forEach(searchInDirectory);

if (handlers.length === 0) {
  console.log('❌ 未找到任何 Command Handler');
} else {
  // 按命令名排序
  handlers.sort((a, b) => a.command.localeCompare(b.command));

  console.log(`找到 ${handlers.length} 个 Handler:\n`);

  handlers.forEach((handler, index) => {
    console.log(`${index + 1}. ${handler.command}`);
    console.log(`   Handler: ${handler.handler}`);
    console.log(`   文件: ${handler.file}:${handler.line}`);
    console.log('');
  });

  console.log('💡 查看具体 Handler:');
  console.log('   node scripts/find-handler.js <CommandName>');
}

