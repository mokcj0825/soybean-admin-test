# 🚀 运行 V3 DDD API

## 快速启动（2分钟）

### 1. 启动服务

```bash
cd backend
pnpm --filter v3-structure start
```

或者直接在项目根目录：

```bash
nest start v3-structure --watch
```

### 2. 测试 API

**方式1：使用 curl**

```bash
curl -X POST http://localhost:9529/v3/api/order/create-with-payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "items": [
      {
        "productId": "prod_001",
        "skuId": "sku_001",
        "quantity": 2
      }
    ],
    "shippingAddressId": "addr_456",
    "paymentMethod": "wechat_pay",
    "couponCode": "SUMMER2024",
    "remark": "测试订单"
  }'
```

**方式2：使用 .http 文件**

打开 `backend/apps/v3-structure/test-api.http`，点击 `Send Request`

### 3. 观察控制台输出

你会看到完整的执行流程：

```
╔═══════════════════════════════════════════════════════════╗
║        开始处理订单创建命令 (Command Handler)             ║
╚═══════════════════════════════════════════════════════════╝

【阶段1】验证用户
【阶段2】验证商品并获取商品信息
【阶段3】验证并预留库存
【阶段4】验证并锁定优惠券
【阶段5】获取收货地址
【阶段6】计算订单金额
【阶段7】创建订单领域对象
【阶段8】持久化订单（事务）
【阶段9】发起第三方支付
【阶段10】发布领域事件

╔═══════════════════════════════════════════════════════════╗
║                  ✅ 订单创建成功！                        ║
╚═══════════════════════════════════════════════════════════╝
```

## API 端点

- **URL**: `http://localhost:9529/v3/api/order/create-with-payment`
- **Method**: `POST`
- **Port**: `9529` （避免与 base-system 的 9528 冲突）

## 目录结构

```
v3-structure/
├── src/
│   ├── main.ts                  ⭐ 启动文件
│   ├── app.module.ts            ⭐ 根模块
│   ├── order.module.ts          ⭐ 订单模块（依赖注入配置）
│   ├── api/                     HTTP 层
│   ├── lib/                     领域层
│   └── infra/                   基础设施层
├── test-api.http                ⭐ API 测试文件
├── package.json
└── tsconfig.json
```

## 快速验证

启动成功后，你应该看到：

```
╔════════════════════════════════════════════════════╗
║     V3 DDD Architecture API Server Started        ║
╚════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:9529
📝 API Endpoint: http://localhost:9529/v3/api/order
```

## 故障排查

### 端口已被占用

修改 `src/main.ts` 中的端口号：

```typescript
await app.listen(9530); // 改成其他端口
```

### 依赖问题

确保已安装 NestJS 依赖：

```bash
cd backend
pnpm install
```

## 完成！

现在你有了一个**真正可以运行的 V3 DDD API**！🎉

