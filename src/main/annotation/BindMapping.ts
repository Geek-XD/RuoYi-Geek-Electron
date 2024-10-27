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


/*
class Test1Controller {

  // 相当于 ipcMain.on('test1',this.test1)
  @BindMapping('test1','on') 
  test1(_event,data){}

  // 相当于 ipcMain.handle('test2',this.test2)
  @BindMapping('test2','handle') 
  test2(_event,data){}

  // 相当于 ipcMain.handle('test3',this.test2)
  @BindMapping
  test3(_event,data){}
}

// 相当于
// ipcMain.handle('test4',Test2Controller.test1)
// ipcMain.handle('test5',Test2Controller.test1)
// 不会绑定静态方法
@BindMapping
class Test2Controller {
  test4(_event,data){}
  test5(_event,data){}
}

// 相当于
// ipcMain.on('beastest6',Test2Controller.test1)
// ipcMain.on('beastest7',Test2Controller.test1)
// 不会绑定静态方法
@BindMapping("beas","on")
class Test2Controller {
  test6(_event,data){}
  test7(_event,data){}
}

*/