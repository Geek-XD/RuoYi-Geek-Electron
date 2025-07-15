
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
    const port = app.commandLine.getSwitchValue("remote-debugging-port");
    if (!port) await pie.initialize(app)
    browser = await pie.connect(app, (puppeteer as unknown as typeof Puppeteer))
}


async function waitForPageLoad(window: BrowserWindow): Promise<void> {
    const tempGuid = UUID.v4()
    try {
        if (window.webContents.getURL() === '') {
            await window.webContents.loadURL('about:blank')
        }
        await window.webContents.executeJavaScript(`window.tempPuppeteerId = "${tempGuid}"`)
        await getBrowser().waitForTarget(
            async (target) => {
                if (target.type() !== 'page') return false
                try {
                    const page = await target.page()
                    if (!page) return false
                    return (await page.evaluate('window.tempPuppeteerId')) === tempGuid
                } catch (e) {
                    return false
                }
            },
            { timeout: 5000 }
        )
    } catch (error: any) {
        window.destroy()
        throw new Error('等待 Puppeteer 目标超时，无法找到新窗口。')
    } finally {
        if (!window.isDestroyed()) {
            await window.webContents.executeJavaScript('delete window.tempPuppeteerId')
        }
    }
}