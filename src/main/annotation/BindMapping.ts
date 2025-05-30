import { ipcMain, IpcMainInvokeEvent } from 'electron'

// 构造函数
type Constructor<T> = new (...args: any[]) => T
type IpcType = 'on' | 'once' | 'handle' | 'handleOnce'
type IpcMainHandle = (event: IpcMainInvokeEvent, ...args: any[]) => any
function isConstructor(target: any): target is Constructor<any> {
  return typeof target === 'function' && 'prototype' in target
}

function handleIpcMain(name: string, fun: IpcMainHandle, type: IpcType) {
  console.log(`[ipcMain][${name}]:type "${type}" is defined`);
  if (type in ipcMain) ipcMain[type](name, fun)
  else throw new Error(`[ipcMain][${name}]:type "${type}" is not defined`)
}
function filterInstanceMethods(o: any) {
  return Object.getOwnPropertyNames(o.prototype).filter(
    (prop) => typeof o.prototype[prop] === 'function' && prop !== 'constructor'
  )
}

type Annotation = (target: object, atta?: string, sym?: TypedPropertyDescriptor<IpcMainHandle>) => void

function BindMapping(name: string): Annotation
function BindMapping(name: string, type: IpcType): Annotation
function BindMapping(target: object, atta: string, sym: TypedPropertyDescriptor<IpcMainHandle>): void
function BindMapping(
  target: string | object | IpcMainHandle,
  atta?: IpcType | string,
  sym?: TypedPropertyDescriptor<IpcMainHandle>
): void | ((target: object, atta: string, sym: TypedPropertyDescriptor<IpcMainHandle>) => void) {
  if (typeof target === 'string') {
    const name = target
    console.log("name:", name);
    
    const type = typeof atta === 'string' ? atta as IpcType : 'handle'
    return (target: any, _atta?: any, sym?: any) => {
      isConstructor(target)
        ? filterInstanceMethods(target).forEach((i) => handleIpcMain(name + i, target.prototype[i], type))
        : handleIpcMain(name, sym.value, type)
    }
  } else if (typeof target === 'object' && typeof atta === 'string' && typeof sym === 'object') {
    isConstructor(target)
      ? filterInstanceMethods(target).forEach((i) => handleIpcMain(i, target.prototype[i], 'handle'))
      : handleIpcMain(atta, sym.value!, 'handle')
  }
}

export default BindMapping
