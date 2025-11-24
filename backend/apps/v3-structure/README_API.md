# ✅ V3 DDD 真正可运行的 API

## 🚀 3步启动

### 1. 启动服务（1分钟）

```bash
cd backend
nest start v3-structure --watch
```

### 2. 发送请求（30秒）

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

### 3. 查看输出

你会看到完整的10个业务阶段执行流程！

---

## 📁 核心文件

### 可运行的 API 文件

| 文件 | 作用 |
|-----|------|
| ✅ `src/main.ts` | **NestJS 启动入口** |
| ✅ `src/app.module.ts` | **根模块** |
| ✅ `src/order.module.ts` | **订单模块（依赖注入配置）** |
| ✅ `src/api/order/rest/order.controller.ts` | **HTTP 控制器（@Controller）** |
| ✅ `src/lib/.../create-order-with-payment.handler.ts` | **业务逻辑（@Injectable）** |
| ✅ `test-api.http` | **API 测试文件** |

---

## 🎯 API 端点

### POST /v3/api/order/create-with-payment

**URL**: `http://localhost:9529/v3/api/order/create-with-payment`

**请求体**:
```json
{
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
}
```

**响应**:
```json
{
  "orderId": "1234567890-abc123",
  "orderNumber": "ORD1234567890123",
  "finalAmount": 138.1,
  "paymentInfo": {
    "paymentId": "pay_1234567890",
    "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=mock_...",
    "expireTime": "2024-01-15T12:30:00.000Z"
  },
  "estimatedDelivery": "2024-01-17T10:00:00.000Z"
}
```

---

## 📊 目录结构

```
v3-structure/
├── src/
│   ├── main.ts                          ⭐ 启动文件
│   ├── app.module.ts                    ⭐ 根模块
│   ├── order.module.ts                  ⭐ 订单模块（DI配置）
│   │
│   ├── api/                             🌐 HTTP 层
│   │   └── order/rest/
│   │       └── order.controller.ts      ⭐ @Controller
│   │
│   ├── lib/                             📚 领域层
│   │   ├── shared-kernel/
│   │   └── bounded-contexts/order/
│   │       ├── domain/
│   │       ├── application/
│   │       │   └── command-handlers/
│   │       │       └── create-order-with-payment.handler.ts  ⭐ @Injectable
│   │       ├── commands/
│   │       └── ports/
│   │
│   └── infra/                           🔧 基础设施层
│       └── bounded-contexts/order/adapters/
│           ├── repositories/            ⭐ @Injectable
│           ├── payment-gateway/         ⭐ @Injectable
│           └── notification/            ⭐ @Injectable
│
├── test-api.http                        ⭐ 测试文件
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## 🔧 依赖注入配置

### order.module.ts

```typescript
@Module({
  imports: [CqrsModule],
  controllers: [OrderController],  // ← HTTP 控制器
  providers: [
    // Command Handler
    CreateOrderWithPaymentHandler,
    
    // Domain Services
    PriceCalculatorService,
    
    // Infrastructure - 端口的实现
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepositoryImpl,
    },
    {
      provide: PAYMENT_GATEWAY,
      useClass: WeChatPaymentGatewayAdapter,
    },
  ],
})
export class OrderModule {}
```

---

## 💡 关键代码

### Controller（15行核心代码）

```typescript
@Controller('order')
export class OrderController {
  constructor(
    private readonly createOrderHandler: CreateOrderWithPaymentHandler,
  ) {}

  @Post('create-with-payment')
  async createOrderWithPayment(@Body() dto: CreateOrderDto) {
    const command = new CreateOrderWithPaymentCommand(...);
    const result = await this.createOrderHandler.execute(command);
    return result;
  }
}
```

### Command Handler（300行业务编排）

```typescript
@Injectable()
export class CreateOrderWithPaymentHandler {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orderRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway,
    private readonly priceCalculator: PriceCalculatorService,
  ) {}

  async execute(command: CreateOrderWithPaymentCommand) {
    // 10个业务阶段的编排...
  }
}
```

---

## 🎉 成功标志

启动成功后，控制台会显示：

```
╔════════════════════════════════════════════════════╗
║     V3 DDD Architecture API Server Started        ║
╚════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:9529
📝 API Endpoint: http://localhost:9529/v3/api/order
```

调用 API 后，会看到完整的执行流程：

```
╔═══════════════════════════════════════════════════════════╗
║        开始处理订单创建命令 (Command Handler)             ║
╚═══════════════════════════════════════════════════════════╝

【阶段1】验证用户
✅ 用户验证通过: test_user (vip)

【阶段2】验证商品并获取商品信息
✅ 商品验证通过，共 1 个商品

【阶段3】验证并预留库存
✅ 库存预留成功

...（省略）

╔═══════════════════════════════════════════════════════════╗
║                  ✅ 订单创建成功！                        ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 📝 对比说明

### ❌ 之前：只有架构，没有 API

- 创建了大量的类和接口
- 但**没有 NestJS 模块配置**
- 没有依赖注入
- **无法启动和运行**

### ✅ 现在：真正可运行的 API

- ✅ NestJS 启动入口（main.ts）
- ✅ 模块配置（app.module.ts, order.module.ts）
- ✅ 依赖注入（@Injectable, @Inject）
- ✅ HTTP 路由（@Controller, @Post）
- ✅ 测试文件（test-api.http）
- ✅ **可以立即启动和测试**

---

## 🚀 立即开始

```bash
# 启动
cd backend
nest start v3-structure --watch

# 测试（另开一个终端）
curl -X POST http://localhost:9529/v3/api/order/create-with-payment \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_001", "items": [{"productId": "prod_001", "skuId": "sku_001", "quantity": 2}], "shippingAddressId": "addr_456", "paymentMethod": "wechat_pay"}'
```

**现在真的可以运行了！** 🎉

