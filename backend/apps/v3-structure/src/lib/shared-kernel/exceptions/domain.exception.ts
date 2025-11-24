/**
 * 领域异常基类
 * 
 * 职责：
 * - 表示业务规则违反
 * - 携带错误码和上下文信息
 * 
 * 为什么放在 shared-kernel：
 * - 所有限界上下文的领域异常都应该继承这个基类
 * - 统一的异常处理机制
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'DomainException';
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

/**
 * 业务验证失败异常
 */
export class ValidationException extends DomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationException';
  }
}

/**
 * 资源未找到异常
 */
export class NotFoundException extends DomainException {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 'NOT_FOUND', {
      resource,
      identifier,
    });
    this.name = 'NotFoundException';
  }
}

/**
 * 并发冲突异常
 */
export class ConcurrencyException extends DomainException {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONCURRENCY_ERROR', context);
    this.name = 'ConcurrencyException';
  }
}

