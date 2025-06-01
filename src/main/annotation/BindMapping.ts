import { ipcMain, IpcMainInvokeEvent } from 'electron'
import type { ClassDecorator, Constructor, MethodDecorator } from './base'
import { isConstructor, filterInstanceMethods } from './base';

type IpcType = 'on' | 'once' | 'handle' | 'handleOnce'
type IpcMainHandle = (event: IpcMainInvokeEvent, ...args: any[]) => any

function handleIpcMain(name: string, fun: IpcMainHandle, type: IpcType) {
  if (type in ipcMain) ipcMain[type](name, fun)
  else throw new Error(`[ipcMain][${name}]:type "${type}" is not defined`)
}

function BindMapping(name: string): MethodDecorator & ClassDecorator<any>
function BindMapping(name: string, type: IpcType): MethodDecorator & ClassDecorator<any>
function BindMapping<T extends Constructor<any>>(target: T): void;
function BindMapping(target: object, atta: string, sym: TypedPropertyDescriptor<IpcMainHandle>): void
function BindMapping(
  target: string | object | IpcMainHandle,
  atta?: IpcType | string,
  sym?: TypedPropertyDescriptor<IpcMainHandle>
): void | ((target: object, atta: string, sym: TypedPropertyDescriptor<IpcMainHandle>) => void) {
  if (typeof target === 'string') {
    const name = target
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
