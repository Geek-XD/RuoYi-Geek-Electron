/**
 * 函数执行时间测量工具 - 同时支持同步和异步函数
 *
 * 该函数会测量传入函数的执行时间，并返回其执行结果和耗时。
 * 对于同步函数，直接计算执行前后的时间差
 * 对于异步函数，会等待 Promise 完成后再计算总耗时
 *
 * @param fn 需要测量执行时间的函数(同步或异步)
 * @returns 返回一个新的函数，当调用这个函数时，它会执行原始函数并测量执行时间
 * @example
 * // 用于同步函数
 * const measuredSync = measureTime((a, b) => a + b);
 * const { result, time } = measuredSync(5, 3); // { result: 8, time: 1 }
 * 
 * // 用于异步函数
 * const measuredAsync = measureTime(async (url) => await fetch(url));
 * const { result, time } = await measuredAsync('https://example.com'); // { result: Response, time: 120 }
 */
export function measureTime<T>(fn: (...args: any[]) => T | Promise<T>) {
  return (...args: any[]) => {
    const start = Date.now();
    const result = fn(...args);
    if (result instanceof Promise) {
      return result.then(value => {
        const end = Date.now();
        return { result: value, time: end - start };
      }).catch(error => {
        const end = Date.now();
        throw { error, time: end - start };
      });
    } else {
      const end = Date.now();
      return { result, time: end - start };
    }
  };
}

import { app } from "electron";
import * as http from "http";
export function readVersion(): Promise<{
  "Browser": string;
  "Protocol-Version": string;
  "User-Agent": string;
  "V8-Version": string;
  "WebKit-Version": string;
  "webSocketDebuggerUrl": string;
}> {
  const port = app.commandLine.getSwitchValue("remote-debugging-port");
  if (!port) return Promise.reject(new Error("Remote debugging port is not set. Please initialize the app first."));
  return new Promise((resolve, reject) => {
    let json = "";
    const request = http.request(
      {
        host: "127.0.0.1",
        path: "/json/version",
        port
      },
      (response) => {
        response.on("error", reject);
        response.on("data", (chunk: Buffer) => {
          json += chunk.toString();
        });
        response.on("end", () => resolve(JSON.parse(json)));
      }
    );
    request.on("error", reject);
    request.end();
  });
}