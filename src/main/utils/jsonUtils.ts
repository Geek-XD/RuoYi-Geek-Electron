import fs from 'fs'
/**
 * 从JSON文件里面读取json
 * @param filePath JSON文件的路径
 * @returns 返回解析后的JSON对象
 */
export function JSONLoads(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(content)
}
/**
 * 将给定的数据转换为JSON字符串，并将其写入指定的文件路径
 * @param filePath 文件路径，用于指定JSON数据的保存位置
 * @param data 要保存的数据，可以是任何可以被JSON序列化的JavaScript值
 */
export function JSONDumps<T>(filePath: string, data: T): void {
  const jsonString = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, jsonString, 'utf8')
}
