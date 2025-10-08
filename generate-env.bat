@echo off
setlocal enabledelayedexpansion

REM Docker Compose 环境变量生成脚本 (Windows)
REM 用法: generate-env.bat

echo ================================
echo Docker Compose 环境变量生成器
echo ================================
echo.

REM 检查 .env 文件是否已存在
if exist ".env" (
    echo [警告] .env 文件已存在
    echo 当前配置：
    echo ----------------------------------------
    type .env
    echo ----------------------------------------
    echo.
    set /p overwrite="是否覆盖现有配置? (y/N): "
    if /i not "!overwrite!"=="y" (
        echo [取消] 操作已取消
        exit /b 0
    )
    REM 备份现有文件
    copy .env .env.backup >nul
    echo [完成] 已备份现有配置到 .env.backup
)

REM 检查示例文件是否存在
if not exist "env.docker.example" (
    echo [错误] 找不到 env.docker.example 文件
    echo 请确保在项目根目录下运行此脚本
    exit /b 1
)

echo 请选择配置模式：
echo   1) 使用默认配置（推荐，快速开始）
echo   2) 交互式配置（自定义端口和密码）
echo   3) 直接复制示例文件
set /p choice="请输入选项 (1-3): "
echo.

if "%choice%"=="1" (
    echo [进行中] 使用默认配置...
    copy env.docker.example .env >nul
    echo [完成] .env 文件已创建（使用默认配置）
) else if "%choice%"=="2" (
    echo [配置] 交互式配置
    echo 请输入配置值（直接按回车使用默认值）
    echo.
    
    REM 数据库配置
    echo [数据库配置]
    set /p db_port="PostgreSQL 端口 (默认: 25432): "
    if "!db_port!"=="" set db_port=25432
    
    set /p db_user="数据库用户名 (默认: soybean): "
    if "!db_user!"=="" set db_user=soybean
    
    set /p db_pass="数据库密码 (默认: soybean@123.): "
    if "!db_pass!"=="" set db_pass=soybean@123.
    
    set /p db_name="数据库名称 (默认: soybean-admin-nest-backend): "
    if "!db_name!"=="" set db_name=soybean-admin-nest-backend
    
    echo.
    REM Redis 配置
    echo [Redis 配置]
    set /p redis_port="Redis 端口 (默认: 26379): "
    if "!redis_port!"=="" set redis_port=26379
    
    set /p redis_pass="Redis 密码 (默认: 123456): "
    if "!redis_pass!"=="" set redis_pass=123456
    
    echo.
    REM 应用配置
    echo [应用配置]
    set /p app_port="后端端口 (默认: 9528): "
    if "!app_port!"=="" set app_port=9528
    
    set /p frontend_port="前端端口 (默认: 9527): "
    if "!frontend_port!"=="" set frontend_port=9527
    
    echo.
    REM JWT 配置
    echo [JWT 配置（生产环境建议自定义）]
    set /p jwt_secret="JWT 密钥 (默认: 使用示例密钥): "
    if "!jwt_secret!"=="" set jwt_secret=JWT_SECRET-soybean-admin-nest@123456!@#.
    
    REM 生成配置文件
    (
        echo # ===========================================
        echo # Docker Compose 环境变量配置
        echo # ===========================================
        echo # 由 generate-env.bat 生成
        echo.
        echo # ===========================================
        echo # Docker Compose 项目配置
        echo # ===========================================
        echo COMPOSE_PROJECT_NAME=sds-local
        echo.
        echo # ===========================================
        echo # 数据库配置 (PostgreSQL^)
        echo # ===========================================
        echo POSTGRES_USER=!db_user!
        echo POSTGRES_PASSWORD=!db_pass!
        echo POSTGRES_DB=!db_name!
        echo DATABASE_PORT=!db_port!
        echo DATABASE_INTERNAL_PORT=5432
        echo.
        echo # ===========================================
        echo # Redis 配置
        echo # ===========================================
        echo REDIS_PASSWORD=!redis_pass!
        echo REDIS_PORT=!redis_port!
        echo REDIS_INTERNAL_PORT=6379
        echo REDIS_DB=1
        echo.
        echo # ===========================================
        echo # 后端配置 (Backend^)
        echo # ===========================================
        echo BACKEND_PORT=!app_port!
        echo NODE_ENV=production
        echo DOC_SWAGGER_ENABLE=true
        echo DOC_SWAGGER_PATH=api-docs
        echo CASBIN_MODEL=model.conf
        echo.
        echo # ===========================================
        echo # JWT 配置
        echo # ===========================================
        echo JWT_SECRET=!jwt_secret!
        echo JWT_EXPIRE_IN=3600
        echo REFRESH_TOKEN_SECRET=REFRESH_TOKEN_EXPIRE_IN-soybean-admin-nest@123456!@#.
        echo REFRESH_TOKEN_EXPIRE_IN=7200
        echo.
        echo # ===========================================
        echo # 前端配置 (Frontend^)
        echo # ===========================================
        echo FRONTEND_PORT=!frontend_port!
        echo.
        echo # ===========================================
        echo # PgBouncer 配置
        echo # ===========================================
        echo PGBOUNCER_PORT=6432
        echo.
        echo # ===========================================
        echo # 时区配置
        echo # ===========================================
        echo TZ=Asia/Shanghai
    ) > .env
    echo [完成] .env 文件已创建（自定义配置）
) else if "%choice%"=="3" (
    copy env.docker.example .env >nul
    echo [完成] .env 文件已创建（复制自示例文件）
    echo [提示] 请手动编辑 .env 文件进行自定义
) else (
    echo [错误] 无效的选项
    exit /b 1
)

REM ================================================
REM 自动同步 backend/.env 文件
REM ================================================
echo.
echo [进行中] 正在同步 backend\.env 配置...

if exist ".env" (
    REM 读取配置变量
    for /f "tokens=1,2 delims==" %%a in ('findstr /r "^POSTGRES_USER= ^POSTGRES_PASSWORD= ^POSTGRES_DB= ^DATABASE_PORT=" .env') do (
        if "%%a"=="POSTGRES_USER" set BE_USER=%%b
        if "%%a"=="POSTGRES_PASSWORD" set BE_PASS=%%b
        if "%%a"=="POSTGRES_DB" set BE_DB=%%b
        if "%%a"=="DATABASE_PORT" set BE_PORT=%%b
    )
    
    REM 生成 backend/.env
    (
        echo # Environment variables declared in this file are automatically made available to Prisma.
        echo # See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema
        echo.
        echo # Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
        echo # See the documentation for all the connection string options: https://pris.ly/d/connection-strings
        echo.
        echo DATABASE_URL="postgresql://!BE_USER!:!BE_PASS!@localhost:!BE_PORT!/!BE_DB!?schema=public"
        echo #使用pgbouncer请打开以下注释
        echo #DATABASE_URL="postgresql://!BE_USER!:!BE_PASS!@localhost:6432/!BE_DB!?schema=public&pgbouncer=true"
        echo DIRECT_DATABASE_URL="postgresql://!BE_USER!:!BE_PASS!@localhost:!BE_PORT!/!BE_DB!?schema=public"
    ) > backend\.env
    
    echo [完成] backend\.env 文件已自动同步
) else (
    echo [错误] 无法找到 .env 文件，跳过 backend\.env 同步
)

echo.
echo ================================
echo 配置完成！
echo ================================
echo.
echo 当前配置：
echo ----------------------------------------
type .env
echo ----------------------------------------
echo.
echo 接下来的步骤：
echo   1. 检查 .env 文件配置是否正确
echo   2. 运行: docker-compose -p soybean-admin-nest up -d
if "%choice%"=="2" (
    echo   3. 访问: http://localhost:!frontend_port!
) else (
    echo   3. 访问: http://localhost:9527
)
echo.
echo [提示]
echo   - 如需修改配置，请编辑 .env 文件后运行: docker-compose down ^&^& docker-compose up -d
echo   - 理解端口配置: 查看 DOCKER_NETWORKING_PORTS.md
echo.

endlocal

