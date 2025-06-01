import winston, { Logger } from 'winston';
import { isConstructor, filterInstanceMethods } from './base';
import type { Constructor, ClassDecorator, MethodDecorator } from './base'

// 日志级别类型
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// 异常配置类型
interface ExceptionConfig {
    exceptionType: new (...args: any[]) => Error;
    logLevel: LogLevel;
    message?: string;
}

// Log 装饰器配置选项
interface LogOptions {
    /** 是否在函数执行前打印函数信息和参数 */
    logBefore?: boolean;
    /** 是否打印函数参数 */
    logParams?: boolean;
    /** 是否在函数执行后打印返回结果 */
    logAfter?: boolean;
    /** 异常处理配置 */
    exceptions?: ExceptionConfig[];
    /** 自定义日志前缀 */
    prefix?: string;
    /** 日志级别，默认为 info */
    level?: LogLevel;
}

// 创建默认的 winston logger
const createLogger = (): Logger => {
    return winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ level, message, timestamp, stack }) => {
                return `[${timestamp}] [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
            })
        ),
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ level, message, timestamp, stack }) => {
                        return `[${timestamp}] [${level}]: ${message}${stack ? '\n' + stack : ''}`;
                    })
                )
            }),
            // 可以添加文件输出
            new winston.transports.File({ filename: 'logs/app.log' }),
        ]
    });
};

// 全局 logger 实例
const logger = createLogger();

// Log 装饰器重载 - 支持带配置的类装饰器和方法装饰器
function Log(options?: LogOptions): MethodDecorator & ClassDecorator<any>;
// 直接应用到方法
function Log(target: object, propertyKey: string, descriptor: PropertyDescriptor): void;
// 直接应用到类
function Log<T extends Constructor<any>>(target: T): T | void;
function Log<T extends Constructor<any>>(
    target?: LogOptions | object | T,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
): void | MethodDecorator | ClassDecorator<T> | T {

    // 如果第一个参数是配置对象或为空，返回装饰器函数
    if (typeof target === 'undefined' || (typeof target === 'object' && !isConstructor(target) && !propertyKey && !descriptor)) {
        const options = (target as LogOptions) || {}; return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
            if (isConstructor(target) && !propertyKey && !descriptor) {
                // 类装饰器
                applyLogToClass(target, options);
                return target;
            } else if (typeof propertyKey === 'string' && descriptor) {
                // 方法装饰器
                applyLogDecorator(target, propertyKey, descriptor, options);
                return;
            }
            return;
        };
    }
    // 直接应用到类
    else if (isConstructor(target) && !propertyKey && !descriptor) {
        applyLogToClass(target as T, {});
        return target as T;
    }    // 直接应用到方法
    else if (typeof target === 'object' && typeof propertyKey === 'string' && descriptor) {
        applyLogDecorator(target, propertyKey, descriptor, {});
        return;
    }
}

// 应用日志装饰器到类的所有方法
function applyLogToClass<T extends Constructor<any>>(target: T, options: LogOptions) {
    const methods = filterInstanceMethods(target);

    methods.forEach((methodName) => {
        const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);
        if (descriptor && typeof descriptor.value === 'function') {
            applyLogDecorator(target.prototype, methodName, descriptor, options);
        }
    });
}

function applyLogDecorator(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
    options: LogOptions
) {
    const originalMethod = descriptor.value;
    const className = isConstructor(target) ? target.name : target.constructor.name;
    const methodName = propertyKey;
    const prefix = options.prefix || `[${className}.${methodName}]`;

    // 默认配置
    const config = {
        logBefore: options.logBefore ?? true,
        logAfter: options.logAfter ?? true,
        logParams: options.logParams ?? options.logBefore ?? true,
        exceptions: options.exceptions || [],
        level: options.level || 'info'
    };

    descriptor.value = function (...args: any[]) {
        const startTime = Date.now();

        // 执行前日志
        if (config.logBefore) {
            const argsStr = args.length > 0 ? JSON.stringify(args, null, 2) : '无参数';
            if (config.logParams) {
                logger[config.level](`${prefix} 函数执行开始  参数: ${argsStr}`);
            } else {
                logger[config.level](`${prefix} 函数执行开始`);
            }
        }

        try {
            // 执行原方法
            const result = originalMethod.apply(this, args);

            // 如果返回 Promise，处理异步情况
            if (result && typeof result.then === 'function') {
                return result
                    .then((asyncResult: any) => {
                        if (config.logAfter) {
                            const duration = Date.now() - startTime;
                            logger[config.level](`${prefix} 函数执行完成 (耗时: ${duration}ms)`);
                            logger[config.level](`${prefix} 返回值: ${JSON.stringify(asyncResult, null, 2)}`);
                        }
                        return asyncResult;
                    })
                    .catch((error: any) => {
                        handleException(error, config.exceptions, prefix);
                    });
            } else {
                // 同步方法的执行后日志
                if (config.logAfter) {
                    const duration = Date.now() - startTime;
                    logger[config.level](`${prefix} 函数执行完成 (耗时: ${duration}ms)`);
                    logger[config.level](`${prefix} 返回值: ${JSON.stringify(result, null, 2)}`);
                } return result;
            }
        } catch (error) {
            handleException(error, config.exceptions, prefix);
        }
    };

    target[propertyKey] = descriptor.value;
}

function handleException(error: any, exceptions: ExceptionConfig[], prefix: string) {
    let logLevel: LogLevel = 'error';
    let message = `${prefix} 函数执行异常`;

    // 查找匹配的异常配置
    for (const config of exceptions) {
        if (error instanceof config.exceptionType) {
            logLevel = config.logLevel;
            if (config.message) {
                message = `${prefix} ${config.message}`;
            }
            break;
        }
    }

    // 输出异常日志
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger[logLevel](`${message}: ${errorMessage}`);
    if (errorStack && logLevel === 'error') {
        logger[logLevel](`${prefix} 错误堆栈:\n${errorStack}`);
    }
}

// 导出 logger 实例供其他地方使用
export { logger };
export default Log;