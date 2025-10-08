@echo off
setlocal enabledelayedexpansion

REM ==============================================================================
REM 清理演示环境（Clean State）
REM ==============================================================================
REM 
REM 用途：停止演示环境并删除所有数据，回到干净状态
REM 注意：不删除 Docker 镜像（保留以便快速重启）
REM 
REM 使用方法：
REM   demo-clean.bat
REM 
REM ==============================================================================

echo =============================================
echo 清理演示环境（Clean State）
echo =============================================
echo.

REM 检查演示环境是否在运行
docker-compose -f docker-compose.demo.yml ps | findstr /C:"Up" >nul
if %errorlevel% equ 0 (
    echo [进行中] 演示环境正在运行，准备停止...
    echo.
) else (
    echo [信息] 演示环境未运行
    echo.
)

REM 停止并删除容器、网络、卷
echo [进行中] 停止容器并删除数据...
docker-compose -f docker-compose.demo.yml down -v

if %errorlevel% equ 0 (
    echo [完成] 容器已停止
    echo [完成] 网络已删除
    echo [完成] 数据卷已删除
    echo.
) else (
    echo [错误] 清理失败
    exit /b 1
)

REM 验证清理
echo [进行中] 验证清理结果...

REM 检查容器
docker ps -a | findstr /C:"sds-demo" >nul
if %errorlevel% equ 0 (
    echo [警告] 发现容器残留
    docker ps -a | findstr /C:"sds-demo"
) else (
    echo [完成] 无残留容器
)

REM 检查网络
docker network ls | findstr /C:"sds-demo" >nul
if %errorlevel% equ 0 (
    echo [警告] 发现网络残留
    docker network ls | findstr /C:"sds-demo"
) else (
    echo [完成] 无残留网络
)

REM 检查卷
docker volume ls | findstr /C:"sds-demo" >nul
if %errorlevel% equ 0 (
    echo [警告] 发现数据卷残留
    docker volume ls | findstr /C:"sds-demo"
) else (
    echo [完成] 无残留数据卷
)

echo.
echo =============================================
echo 清理完成！
echo =============================================
echo.
echo [状态]
echo   - 容器：已删除
echo   - 网络：已删除
echo   - 数据卷：已删除
echo   - 镜像：已保留（用于快速重启）
echo.
echo [下次启动]
echo   docker-compose -f docker-compose.demo.yml up -d
echo   （将使用全新的数据）
echo.

endlocal

