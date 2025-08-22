import fs from 'fs'
import { BrowserWindow, net } from 'electron'
import path from 'path'
/**
 * 动态加载JavaScript代码
 *
 * 该函数根据提供的数据路径，异步加载并返回JavaScript代码字符串
 * 它支持从本地文件系统和远程URL加载代码
 *
 * @param data JavaScript代码的路径可以是本地路径或远程URL
 * @returns 返回一个Promise，解析为JavaScript代码字符串
 */
export const getJavaScript = (data: string) => {
  return new Promise<string>((resolve, reject) => {
    if (data.startsWith('file:///')) {
      const scriptPath =
        data[8] == '.' ? path.join(__dirname, data.substring(8)) : data.substring(8)
      fs.readFile(scriptPath, { encoding: 'utf-8' }, (err, script) => {
        if (err) {
          reject(err)
        } else {
          resolve(script)
        }
      })
    } else if (data.startsWith('http://') || data.startsWith('https://')) {
      net.fetch(data).then(async (res) => {
        const script = await res.text()
        resolve(script)
      })
    } else {
      resolve(data)
    }
  })
}

/**
 * 在指定的浏览器窗口或当前环境下执行JavaScript代码
 *
 * 此函数用于在 Electron 的 BrowserWindow 中执行 JavaScript 代码如果未指定窗口，或窗口为 null，
 * 则在当前环境下执行代码这通常用于自动化任务或与页面脚本交互
 *
 * @param win 浏览器窗口对象，用于指定执行脚本的环境如果为 null，则在当前环境下执行
 * @param script 要执行的 JavaScript 代码字符串
 */
export const executeJavaScript = async (win: BrowserWindow | null, script: string) => {
  const realScript = await getJavaScript(script)
  if (win) {
    win.webContents.executeJavaScript(realScript)
  } else {
    eval(realScript)
  }
}
