
import { app } from 'electron'
import type { Browser } from 'puppeteer-core'
import * as  Puppeteer from 'puppeteer-core'
import puppeteer from 'puppeteer-extra'
import BaseWindow from '../window/BaseWindow'
import pie from 'puppeteer-in-electron'
let browser: Browser | null = null

export function getBrowser() {
    if (!browser) throw new Error("Browser is not initialized. Please call initialize() first.");
    return browser
}

export async function getPage(window: BaseWindow) {
    if (window.browserWindow) {
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
