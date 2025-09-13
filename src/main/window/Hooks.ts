import { readVersion } from "@main/utils/common";
import { shell } from "electron";

export async function hookSetUserAgent(context: Electron.CrossProcessExports.BrowserWindow) {
    try {
        const version = await readVersion()
        context.webContents.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ${version["Browser"]} Safari/537.36`)
        console.log(`User-Agent: ${context.webContents.getUserAgent()}`);
    } catch (e) {
    }
}

export function hookReadyToShow(window: Electron.CrossProcessExports.BrowserWindow) {
    window.on('ready-to-show', () => window.show())
}

export function hookLoadUrl(type: 'deny' | 'allow' | 'suppress') {
    if (type === 'deny') {
        return (window: Electron.CrossProcessExports.BrowserWindow) => {
            window.webContents.setWindowOpenHandler((details) => {
                window.loadURL(details.url)  // 在当前窗口加载链接
                return { action: 'deny' }
            })
        }
    } else if (type === 'allow') {
        return (window: Electron.CrossProcessExports.BrowserWindow) => {
            window.webContents.setWindowOpenHandler((details) => {
                shell.openExternal(details.url)  // 使用默认浏览器打开链接
                return { action: 'allow' }
            })
        }
    } else if (type === 'suppress') {
        return (window: Electron.CrossProcessExports.BrowserWindow) => {
            window.webContents.setWindowOpenHandler((details) => {
                return { action: 'deny' }
            })
        }
    } else {
        throw new Error("Invalid type for hookLoadUrl. Use 'deny', 'allow', or 'suppress'.")
    }
}