import { Constructor } from '@main/annotation/base'
import { BrowserWindow } from 'electron'

export default class BaseWindow {
  public browserWindow: BrowserWindow | null = null
  public browserWindowOptions: Electron.BrowserWindowConstructorOptions = {}
  public userData: { [key: string]: any } = {}

  constructor(options?: Electron.BrowserWindowConstructorOptions) {
    Object.assign(this.browserWindowOptions, options)
  }

  public onCreate(_context: BrowserWindow) { }

  public getWindow(): BrowserWindow {
    if (!this.browserWindow) {
      this.browserWindow = new BrowserWindow(this.browserWindowOptions)
      this.onCreate(this.browserWindow)
      return this.browserWindow
    } else {
      return this.browserWindow
    }
  }

  close(): void {
    if (this.browserWindow && !this.browserWindow.isDestroyed()) {
      this.browserWindow.close()
      this.browserWindow = null
    }
  }
}
type HookFun<T extends BaseWindow> = (content: Electron.CrossProcessExports.BrowserWindow, userData: T['userData'], window: T) => void | Promise<void>
type Hook<T extends BaseWindow> = {
  type: 'sync' | 'async',
  fun: HookFun<T>
}
export class WindowBuilder<T extends BaseWindow> {
  private browserWindowOptions: Electron.BrowserWindowConstructorOptions = {}
  private webPreferences: Electron.WebPreferences = {}
  private hooks: Hook<T>[] = []
  constructor(
    private constructorer: Constructor<T> = BaseWindow as Constructor<T>
  ) {
    this.browserWindowOptions.webPreferences = this.webPreferences
  }

  setWebPreferences(options: Electron.WebPreferences): WindowBuilder<T> {
    Object.assign(this.webPreferences, options)
    return this
  }

  setBrowserWindowOptions(options: Electron.BrowserWindowConstructorOptions): WindowBuilder<T> {
    Object.assign(this.browserWindowOptions, options)
    return this
  }

  hook(hook: HookFun<T>): WindowBuilder<T> {
    this.hooks.push({ type: 'sync', fun: hook })
    return this
  }

  asyncHook(hook: HookFun<T>): WindowBuilder<T> {
    this.hooks.push({ type: 'async', fun: hook })
    return this
  }

  async build(): Promise<T> {
    const window = new this.constructorer(this.browserWindowOptions)
    const bw = window.getWindow()
    for (const hook of this.hooks) {
      if (hook.type === 'sync') {
        hook.fun(bw, window.userData, window)
      } else {
        await hook.fun(bw, window.userData, window)
      }
    }
    return window
  }
}

