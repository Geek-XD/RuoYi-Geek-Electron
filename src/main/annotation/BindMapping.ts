import { ipcMain, IpcMainInvokeEvent } from 'electron'

// 构造函数
type Constructor<T> = new (...args: any[]) => T
// 描述符
export type PropertyDescriptor = {
  kind: 'method' | 'getter' | 'setter' | 'field' | 'accessor' | 'class' | 'constructor' | 'unknown'
  name: string
  metadata: any
  addInitializer: any
  static: boolean
  private: boolean
  access: {
    has: (target: any) => boolean
    get: (target: any) => any
    set?: (target: any, value: any) => void
  }
}

type IpcMainHandle = (event: IpcMainInvokeEvent, ...args: any[]) => any
function isConstructor(target: any): target is new (...args: any[]) => any {
  return typeof target === 'function' && 'prototype' in target
}

function handleIpcMain(name: string, fun: IpcMainHandle, type: 'on' | 'once' | 'handle' | 'handleOnce') {
  if (type in ipcMain) ipcMain[type](name, fun)
  else throw new Error(`[ipcMain][${name}]:type "${type}" is not defined`)
}
function filterInstanceMethods(o: any) {
  return Object.getOwnPropertyNames(o.prototype).filter(
    (prop) => typeof o.prototype[prop] === 'function' && prop !== 'constructor'
  )
}
function BindMapping<T>(name: string): (target: IpcMainHandle | Constructor<T>) => void
function BindMapping<T>(clz: Constructor<T> | IpcMainHandle): void
function BindMapping<T>(name: string, type: 'on' | 'handle' | 'handleOnce' | 'once'): (target: IpcMainHandle | Constructor<T>) => void
function BindMapping<T>(clz: Constructor<T> | IpcMainHandle, type: 'on' | 'handle' | 'handleOnce' | 'once'): void
function BindMapping<T>(
  target: string | Constructor<T> | IpcMainHandle,
  propertyKey?: 'on' | 'handle' | 'handleOnce' | 'once' | PropertyDescriptor
): void | ((target: IpcMainHandle | Constructor<T>) => void) {
  if (typeof target === 'string') {
    const name = target
    const type = typeof propertyKey === 'string'? propertyKey : 'handle'
    return (target: IpcMainHandle | Constructor<T>) => {
      isConstructor(target)
        ? filterInstanceMethods(target).forEach((i) => handleIpcMain(name + i, target.prototype[i], type))
        : handleIpcMain(name, target, type)
    }
  } else if (typeof target === 'function') {
    isConstructor(target)
      ? filterInstanceMethods(target).forEach((i) => handleIpcMain(i, target.prototype[i], 'handle'))
      : handleIpcMain(target.name, target, 'handle')
  } else {
    throw new Error('error')
  }
}

export default BindMapping