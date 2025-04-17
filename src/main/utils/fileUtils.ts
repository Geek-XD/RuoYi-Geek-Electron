import { promises as fs } from 'fs'
import path from 'path'

/**
 * 异步函数，用于获取指定路径下的文件和目录的总大小
 * @param {string} inputPath  需要计算大小的文件或目录路径
 * @returns {Promise<number>} 返回文件或目录的总大小
 */
export async function getPathSize(inputPath: string): Promise<number> {
  async function walkDir(currentPath: string) {
    let dirTotalSize = 0
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })
      const sizes = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(currentPath, entry.name)
          try {
            if (entry.isDirectory()) {
              return await walkDir(fullPath)
            } else {
              const stats = await fs.stat(fullPath)
              return stats.size
            }
          } catch (error) {
            console.error(`Error processing file/directory: ${fullPath}`, error)
            return 0 // 返回0，避免undefined
          }
        })
      )
      dirTotalSize = sizes.reduce((acc, cur) => acc + cur, 0)
      return dirTotalSize
    } catch (error) {
      console.error(`Error reading directory: ${currentPath}`, error)
      return 0 // 返回0，避免undefined
    }
  }

  try {
    const stats = await fs.stat(inputPath)
    if (stats.isDirectory()) {
      return await walkDir(inputPath)
    } else if (stats.isFile()) {
      return stats.size
    } else {
      console.error(`The provided path is neither a file nor a directory: ${inputPath}`)
      return 0
    }
  } catch (error) {
    console.error(`Error accessing the provided path: ${inputPath}`, error)
    return 0
  }
}
