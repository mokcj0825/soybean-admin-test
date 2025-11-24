#!/bin/bash

# 快速查找 Command Handler
# 用法: ./find-handler.sh CreateOrderCommand

if [ -z "$1" ]; then
  echo "用法: ./find-handler.sh <CommandName>"
  echo "示例: ./find-handler.sh CreateOrderCommand"
  exit 1
fi

COMMAND_NAME=$1

echo "🔍 查找处理 $COMMAND_NAME 的 Handler..."
echo ""

# 搜索 @CommandHandler 装饰器
grep -rn "@CommandHandler($COMMAND_NAME)" apps/ libs/ 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  line_num=$(echo "$line" | cut -d: -f2)
  
  echo "✅ 找到 Handler:"
  echo "   文件: $file"
  echo "   行号: $line_num"
  echo ""
  
  # 显示类名
  class_line=$(grep -A 2 "@CommandHandler($COMMAND_NAME)" "$file" | grep "class" | head -1)
  if [ -n "$class_line" ]; then
    echo "   类名: $(echo "$class_line" | sed 's/export class //' | sed 's/ .*//')"
  fi
  
  echo ""
  echo "📝 打开文件:"
  echo "   code $file:$line_num"
  echo ""
done

# 如果没找到
if ! grep -rq "@CommandHandler($COMMAND_NAME)" apps/ libs/ 2>/dev/null; then
  echo "❌ 未找到处理 $COMMAND_NAME 的 Handler"
  echo ""
  echo "💡 可能的原因:"
  echo "   1. Handler 还未创建"
  echo "   2. 命令名拼写错误"
  echo "   3. Handler 没有使用 @CommandHandler 装饰器"
fi

