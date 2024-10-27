import fs from 'fs';
/**
 * 从JSON文件里面读取json
 * @param filePath JSON文件的路径
 * @returns 返回解析后的JSON对象
 */
function JSONLoads(filePath: string): any {
    // 读取文件的内容
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}
/**
 * 将给定的数据转换为JSON字符串，并将其写入指定的文件路径
 * @param filePath 文件路径，用于指定JSON数据的保存位置
 * @param data 要保存的数据，可以是任何可以被JSON序列化的JavaScript值
 */
function JSONDumps(filePath: string, data: any): void {
    // 将数据转换为JSON字符串
    const jsonString = JSON.stringify(data, null, 2);
    // 将JSON字符串写入文件
    fs.writeFileSync(filePath, jsonString, 'utf8');
}

export {
    JSONLoads,
    JSONDumps
}