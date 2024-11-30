import { BrowserWindow } from "electron";

export default class BaseWindow {
    static browserWindow: BrowserWindow | null = null;
    static browserWindowOptions: Electron.BrowserWindowConstructorOptions = {};

    static onCreate(_context: BrowserWindow) { }

    static getWindow(): BrowserWindow {
        if (!this.browserWindow) {
            this.browserWindow = new BrowserWindow(this.browserWindowOptions);
            this.onCreate(this.browserWindow)
            return this.browserWindow
        } else {
            return this.browserWindow
        }
    }
}