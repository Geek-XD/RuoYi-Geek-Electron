import { app, BrowserWindow, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import IndexWindow from './window/IndexWindow'
import RuoyiWindow from './window/RuoyiWindow'
import icon from '@resources/icon.png?asset'
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import './controller/IndexController'
import PuppeteerWindow from './window/PuppeteerWindow'

// 如果不需要使用puppeteer，请删除初始化puppeteer的代码
import { initialize } from './utils/puppeteerUtils'
initialize().catch((err) => {
  console.error('puppeteer-in-electron initialize failed:', err)
})

/** 创建初始窗口 */
async function createWindow() {
  IndexWindow.getWindow()   // 用来演示开发一体化工程
  RuoyiWindow.getWindow()   // 用来演示开发页面分离工程
  PuppeteerWindow.getWindow() // 用来演示自动化工具工程    
}

/** 检查是否需要更新 */
function checkUpdate() {
  const feedUrl = `` // 更新地址，仅支持http
  if (feedUrl.startsWith('http')) {
    autoUpdater.setFeedURL(feedUrl)
    autoUpdater.checkForUpdates()
    autoUpdater.on('update-downloaded', (_event) => {
      autoUpdater.quitAndInstall()
    })
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  checkUpdate()
  createWindow().catch((err) => {
    console.error('createWindow failed:', err)
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/** 监听所有窗口创建事件 */
app.on('web-contents-created', (_event, webContents) => {
  // 监听所有从主窗口打开外部连接的窗口，将图标修改成自定义图标
  webContents.setWindowOpenHandler((details) => {
    if (details.url) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1400,
          minWidth: 1400,
          minHeight: 800,
          height: 800,
          autoHideMenuBar: true,
          icon: icon,
          x: 0,
          y: 0,
          resizable: true,
          webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            webSecurity: false,
            nodeIntegration: true,
            nodeIntegrationInWorker: true
          }
        }
      }
    } else {
      return { action: 'deny' }
    }
  })
})

/** 注销全局快捷键 */
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

/** 监听所有窗口关闭事件 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
