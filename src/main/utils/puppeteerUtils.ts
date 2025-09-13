
import { app, BrowserWindow } from 'electron'
import type { Browser } from 'puppeteer-core'
import * as  Puppeteer from 'puppeteer-core'
import puppeteer from 'puppeteer-extra'
import BaseWindow from '../window/BaseWindow'
import * as UUID from 'uuid'
import pie from 'puppeteer-in-electron'
let browser: Browser | null = null

export function getBrowser() {
    if (!browser) throw new Error("Browser is not initialized. Please call initialize() first.");
    return browser
}

export async function getPage(window: BaseWindow) {
    if (window.browserWindow) {
        await waitForPageLoad(window.browserWindow)
        return await pie.getPage(getBrowser(), window.browserWindow)
    } else {
        return null
    }
}

export async function initialize() {
    if (browser) return
    const port = app.commandLine.getSwitchValue("remote-debugging-port");
    if (!port) await pie.initialize(app)
    browser = await pie.connect(app, (puppeteer as unknown as typeof Puppeteer))
}


async function waitForPageLoad(window: BrowserWindow): Promise<void> {
    const tempGuid = UUID.v4()
    // 记录一些调试信息
    try {
        if (window.isDestroyed()) return
        const url = window.webContents.getURL()
        // 仅在空 URL 且未开始加载时考虑 about:blank（多数情况下主流程会自行 loadURL，不强制插入）
        if (!url) {
            // 不立即加载 about:blank，避免打断外部 loadURL 逻辑
        }
        if (window.webContents.isLoading()) {
            await new Promise<void>((resolve) => {
                window.webContents.once('did-finish-load', () => resolve())
                // 兜底 8s 超时
                setTimeout(() => resolve(), 8000)
            })
        }
        if (window.isDestroyed()) return
        await window.webContents.executeJavaScript(`window.tempPuppeteerId = "${tempGuid}"`).catch(()=>{})
        const matched = await Promise.race([
            getBrowser().waitForTarget(
                async (target) => {
                    if (target.type() !== 'page') return false
                    try {
                        const page = await target.page()
                        if (!page) return false
                        return (await page.evaluate('window.tempPuppeteerId')) === tempGuid
                    } catch {
                        return false
                    }
                },
                { timeout: 5000 }
            ).then(()=>true).catch(()=>false),
            new Promise<boolean>(resolve=>setTimeout(()=>resolve(false), 6000))
        ])
        if (!matched) {
            console.warn('[waitForPageLoad] 未匹配到目标 page（可能是初次加载过快或二次导航），继续后续流程。')
        }
    } catch (error) {
        console.warn('[waitForPageLoad] 捕获异常，不销毁窗口，继续后续：', error)
    } finally {
        if (!window.isDestroyed()) {
            window.webContents.executeJavaScript('delete window.tempPuppeteerId').catch(()=>{})
        }
    }
}