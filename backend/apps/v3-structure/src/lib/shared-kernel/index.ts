/**
 * Shared Kernel - 共享内核
 * 
 * 这个模块包含所有限界上下文共享的领域逻辑：
 * 
 * 1. base/ - 领域层基类（Entity, AggregateRoot, ValueObject, DomainEvent）
 * 2. value-objects/ - 通用值对象（Money, Email, PhoneNumber）
 * 3. exceptions/ - 领域异常
 * 4. specifications/ - 通用业务规约（如果有）
 * 
 * 为什么需要 shared-kernel：
 * - 避免代码重复
 * - 保证核心概念在全系统的一致性
 * - 提供稳定的领域基础设施
 */

export * from './base';
export * from './value-objects';
export * from './exceptions';

