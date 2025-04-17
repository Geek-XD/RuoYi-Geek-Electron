import { BrowserWindow } from 'electron'

export default abstract class BaseWindow {
  public browserWindow: BrowserWindow | null = null
  abstract browserWindowOptions: Electron.BrowserWindowConstructorOptions

  protected onCreate(_context: BrowserWindow) {}

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
