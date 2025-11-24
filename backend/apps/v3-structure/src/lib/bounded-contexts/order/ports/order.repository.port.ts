import { Order } from '../domain';

/**
 * 订单仓储端口（接口）
 * 
 * 为什么定义端口：
 * - 依赖倒置：领域层不依赖基础设施层
 * - 业务逻辑独立于技术实现（数据库、ORM等）
 * - 易于测试：可以使用 Mock 实现
 * - 易于更换技术栈：从 PostgreSQL 换成 MongoDB 只需要实现新的适配器
 */
export interface IOrderRepository {
  /**
   * 保存订单（新增或更新）
   */
  save(order: Order): Promise<void>;

  /**
   * 根据ID查找订单
   */
  findById(id: string): Promise<Order | null>;

  /**
   * 根据订单号查找订单
   */
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  /**
   * 查找用户的所有订单
   */
  findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Order[]>;

  /**
   * 删除订单（软删除）
   */
  delete(id: string): Promise<void>;

  /**
   * 生成唯一的订单号
   */
  generateOrderNumber(): Promise<string>;
}

/**
 * 为什么这个接口放在 bounded-contexts/order/ports 而不是 shared-kernel：
 * - 这是 Order 上下文专属的接口
 * - 不同上下文的仓储需求不同
 * - 保持限界上下文的独立性
 */

