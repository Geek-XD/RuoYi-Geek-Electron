import fs from 'fs'
import { BrowserWindow, net } from 'electron'
import path from 'path'
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
export const executeJavaScript = async (win: BrowserWindow | null, script: string) => {
  const realScript = await getJavaScript(script)
  if (win) {
    win.webContents.executeJavaScript(realScript)
  } else {
    eval(realScript)
  }
}
