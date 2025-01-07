import BaseWindow from './BaseWindow'
import path from 'path'
import icon from '@resources/icon.png?asset'
import { shell } from 'electron'
import { is } from '@electron-toolkit/utils'

export default class IndexWindow extends BaseWindow {
  static browserWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true, // 开启自带node环境
      webviewTag: true, // 开启webview
      contextIsolation: true, // 开启context上下文
      webSecurity: false, // 开启网络安全
      allowRunningInsecureContent: true // 允许运行不安全内容
    }
  }

  static onCreate(context: Electron.CrossProcessExports.BrowserWindow): void {
    context.on('ready-to-show', () => {
      context.show()
    })

    context.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      context.webContents.openDevTools()
      context.loadURL(process.env['ELECTRON_RENDERER_URL'])
      context.loadURL("http://localhost:80/")
    } else {
      context.loadFile(path.join(__dirname, '../renderer/index.html'))
    }
  }
}
