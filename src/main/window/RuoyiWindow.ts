import BaseWindow from './BaseWindow'
import path from 'path'
import icon from '@resources/icon.png?asset'
import { shell } from 'electron'
import { is } from '@electron-toolkit/utils'

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
      allowRunningInsecureContent: false // 允许运行不安全内容
    }
  }

  onCreate(context: Electron.CrossProcessExports.BrowserWindow): void {
    context.on('ready-to-show', () => {
      context.show()
    })

    context.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      context.webContents.openDevTools()
      context.loadURL("http://localhost")
    } else {
      context.loadFile("http://localhost")
    }
  }
}

export default new RuoyiWindow()
