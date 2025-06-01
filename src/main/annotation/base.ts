export type Constructor<T> = new (...args: any[]) => T

// 方法装饰器类型
export type MethodDecorator = (target: object, propertyKey: string, descriptor: PropertyDescriptor) => void;
// 类装饰器类型
export type ClassDecorator<T extends Constructor<any>> = (target: T) => T | void;


export function isConstructor(target: any): target is Constructor<any> {
    return typeof target === 'function' && 'prototype' in target;
}


export function filterInstanceMethods(o: any) {
    return Object.getOwnPropertyNames(o.prototype).filter(
        (prop) => typeof o.prototype[prop] === 'function' && prop !== 'constructor'
    );
}
