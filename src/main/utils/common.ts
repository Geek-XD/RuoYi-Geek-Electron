/**
 * 异步函数执行时间测量工具
 * 
 * 该函数接收一个异步函数作为参数，并返回一个新的函数这个新的函数会执行原始异步函数并测量其执行时间
 * 执行时间通过计算从函数开始执行到函数执行结束（Promise resolve或reject）的时间差得出
 * 
 * @param fn 需要测量执行时间的异步函数
 * @returns 返回一个新的函数，当调用这个函数时，它会执行原始异步函数并测量执行时间
 *          如果传入的不是异步函数，则抛出错误
 */
export function measureTimeAsync<T>(fn: (...args: any[]) => Promise<T>) {
    if (fn.constructor.name === 'AsyncFunction') {
        // 异步函数
        return async (...args: any[]) => {
            const start = Date.now();
            const result = await fn(...args);
            const end = Date.now();
            return { result, time: end - start };
        };
    } else {
        throw new Error('measureTimeAsync 只能用于异步函数');
    }
}

/**
 * 创建一个函数来测量另一个函数的执行时间
 * 该函数仅适用于同步函数，不支持异步函数
 * 
 * @param {Function} fn - 需要测量执行时间的函数
 * @returns {Function} - 返回一个新函数，该函数在执行时会测量并返回原函数的执行时间和结果
 * @throws {Error} - 如果尝试测量的函数是异步函数，则抛出错误
 */
export function measureTimeSync<T>(fn: (...args: any[]) => T) {
    if (fn.constructor.name === 'AsyncFunction') {
        throw new Error('measureTimeSync 不能用于异步函数');
    } else {
        // 同步函数
        return (...args: any[]) => {
            const start = Date.now();
            const result = fn(...args);
            const end = Date.now();
            return { result, time: end - start };
        };
    }
}