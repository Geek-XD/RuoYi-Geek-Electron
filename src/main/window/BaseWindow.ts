import { BrowserWindow } from "electron";

class WindowMap extends Map {
    constructor() {
        super()
    }
    get(key: string): BrowserWindow | undefined {
        return super.get(key)
    }
    set(key: string, value: BrowserWindow) {
        return super.set(key, value)
    }
}
const windowMap = new WindowMap()


export default class BaseWindow {
    static browserWindow?: BrowserWindow;
    static browserWindowOptions: Electron.BrowserWindowConstructorOptions | (() => Electron.BrowserWindowConstructorOptions) = {};

    static onCreate(_context: BrowserWindow) { }
    static onClose(_context: BrowserWindow) { }

    static getWindow(): BrowserWindow {
        if (!this.browserWindow) {
            const browserWindowOptions = typeof this.browserWindowOptions === 'function' ? this.browserWindowOptions() : this.browserWindowOptions;
            this.browserWindowOptions = browserWindowOptions
            this.browserWindow = new BrowserWindow(browserWindowOptions);
            this.onCreate(this.browserWindow)
            windowMap.set(this.name, this.browserWindow)
            this.onClose(this.browserWindow)
            this.browserWindow.on("closed", () => {
                this.browserWindow = undefined
                windowMap.delete(this.name)
            })
            return this.browserWindow
        } else {
            return this.browserWindow
        }
    }
}


