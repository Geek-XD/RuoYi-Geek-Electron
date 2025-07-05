import BaseWindow from './BaseWindow'
import path from 'path'
import icon from '@resources/icon.png?asset'
import { shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { readVersion } from '@main/utils/common'

class RuoyiWindow extends BaseWindow {
  browserWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 900,
    height: 670,
    minWidth: 900,
    minHeight: 670,
    show: true,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true, // 开启自带node环境
      webviewTag: true, // 开启webview
      contextIsolation: true, // 开启context上下文
      webSecurity: true, // 开启网络安全
      allowRunningInsecureContent: false, // 允许运行不安全内容,
    }
  }

  async onCreate(context: Electron.CrossProcessExports.BrowserWindow) {
    try {
      const version = await readVersion()
      context.webContents.setUserAgent(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ${version["Browser"]} Safari/537.36`)
      console.log(`User-Agent: ${context.webContents.getUserAgent()}`);
    } catch (e) {
    }
    context.on('ready-to-show', () => {
      context.show()
    })

    context.webContents.setWindowOpenHandler((details) => {
      // shell.openExternal(details.url)  // 使用默认浏览器打开链接
      context.loadURL(details.url)  // 在当前窗口加载链接
      return { action: 'deny' }
    })
    if (is.dev) {
      // context.webContents.openDevTools()
      console.log(`Renderer URL: ${"https://www.browserscan.net/zh"}`);
      context.loadURL("https://www.browserscan.net/zh/bot-detection")
    } else {
      context.loadFile("http://localhost")
    }
  }
}

export default new RuoyiWindow()
