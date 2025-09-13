import { readVersion } from "@main/utils/common";
import { getPage } from "@main/utils/puppeteerUtils";
import { shell } from "electron";
import BaseWindow from "./BaseWindow";
import { json } from "stream/consumers";

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

export async function hookResponseLog(content: Electron.CrossProcessExports.BrowserWindow, userData: any, window: BaseWindow) {
    // 避免重复绑定（多窗口/多次调用）
    const alreadyHooked = (content as any).__responseLogHooked
    if (alreadyHooked) return
    ;(content as any).__responseLogHooked = true

    const attach = async () => {
        try {
            const page = await getPage(window)
            if (!page) {
                console.warn('[hookResponseLog] getPage 返回 null，稍后重试')
                return
            }
            // 这里只需要读取响应体，不需要真正拦截/修改请求 => 不调用 setRequestInterception()
            // 避免 puppeteer 调用 Fetch.enable 产生 Protocol error (Fetch.enable) wasn't found
            console.log('[hookResponseLog] Page ready, 添加 response 监听')

            // 防止重复注册
            if ((page as any).__responseListenerAdded) return
            ;(page as any).__responseListenerAdded = true

            page.on('response', async (response) => {
                const url = response.url()
            })
        } catch (e) {
            console.error('[hookResponseLog] attach 失败: ', e)
        }
    }

    // did-stop-loading 有时过早/过晚；我们同时监听几个阶段，第一次成功即取消其余
    const onceAttach = () => {
        if ((content as any).__responseLogAttached) return
        ;(content as any).__responseLogAttached = true
        attach()
    }

    content.webContents.once('did-finish-load', onceAttach)
    content.webContents.once('did-stop-loading', onceAttach)
    // 兜底：再延迟一次（不使用固定 2s，而是短延迟）
    setTimeout(onceAttach, 500)
}
