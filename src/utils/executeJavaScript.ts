import fs from 'fs'
import { BrowserWindow, net } from 'electron'
import path from 'path'

/**
 * 动态加载JavaScript代码
 * 
 * 该函数根据提供的数据参数，从不同来源加载JavaScript代码它可以处理文件路径和URL，分别使用文件系统和网络请求来获取JavaScript代码
 * 
 * @param data JavaScript代码的来源，可以是文件路径（以'file://'开头），或URL（以'http://'或'https://'开头），也可以是JavaScript代码字符串
 * @returns 返回一个Promise，解析为加载的JavaScript代码字符串如果加载失败，Promise将被拒绝
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
 * 此函数接受一个BrowserWindow对象和一段脚本作为参数，
 * 它首先获取经过处理的真实脚本，然后在给定的BrowserWindow中执行这段脚本
 * 如果没有指定BrowserWindow对象，它将在当前环境下执行脚本
 * 
 * @param win BrowserWindow对象，用于执行脚本的环境如果为null，则在当前环境下执行
 * @param script 要执行的JavaScript代码字符串
 */
export const executeJavaScript = async (win: BrowserWindow | null, script: string) => {
  const realScript = await getJavaScript(script)
  if (win) {
    win.webContents.executeJavaScript(realScript)
  } else {
    eval(realScript)
  }
}
