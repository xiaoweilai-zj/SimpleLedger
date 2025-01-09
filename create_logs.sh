#!/bin/bash

# 设置基础目录，如果没有指定则使用当前目录
BASE_DIR="./logs"

# 创建目录（如果不存在）
mkdir -p "$BASE_DIR"

# 遍历 2024 年的每一天
start_date="2024-01-01"
end_date="2024-12-31"

current_date="$start_date"
while [ "$(date -d "$current_date" +%Y%m%d)" -le "$(date -d "$end_date" +%Y%m%d)" ]; do
    # 生成文件名
    filename="$BASE_DIR/$current_date-app.log"
    
    # 创建空文件
    touch "$filename"
    
    # 为该天生成随机时间（0-23小时，0-59分钟，0-59秒）
    random_hour=$(printf "%02d" $((RANDOM % 24)))
    random_minute=$(printf "%02d" $((RANDOM % 60)))
    random_second=$(printf "%02d" $((RANDOM % 60)))
    
    # 构造目标时间
    target_time="${current_date} ${random_hour}:${random_minute}:${random_second}"
    
    # 转换为时间戳格式（注意：不使用 UTC，保持本地时区）
    timestamp=$(date -d "$target_time" +"%Y%m%d%H%M.%S")
    
    # 设置文件时间戳
    touch -t "$timestamp" "$filename"
    
    # 验证时间戳是否正确设置
    actual_time=$(date -r "$filename" "+%Y-%m-%d %H:%M:%S")
    echo "已创建文件: $filename"
    echo "设置时间: $target_time"
    echo "实际时间: $actual_time"
    echo "-------------------"
    
    # 移到下一天
    current_date=$(date -d "$current_date + 1 day" +%Y-%m-%d)
done

echo "完成！已创建所有 2024 年的日志文件。" 