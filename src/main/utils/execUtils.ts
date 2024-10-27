import { ChildProcess, exec, ExecException, ExecOptions } from 'child_process';

/**
 * 在系统 shell 中执行命令或一系列命令。
 * 
 * @param cmd - 要执行的命令，可以是单个命令字符串或命令数组。
 * @param options - 执行命令的选项，默认为空对象。{}
 * @returns 返回一个 Promise，解析时返回包含子进程和标准输出的对象，拒绝时返回包含子进程和标准错误的对象。
 */
export function runExec(cmd: string | string[], options: ExecOptions = {}) {
 // options：{
//     uid?: number | undefined;
//     gid?: number | undefined;
//     cwd?: string | URL | undefined;
//     env?: NodeJS.ProcessEnv | undefined;
//     windowsHide?: boolean | undefined; @default false
//     timeout?: number | undefined; @default 0
//     shell?: string | undefined;
//     signal?: AbortSignal | undefined;
//     maxBuffer?: number | undefined;
//     killSignal?: NodeJS.Signals | number | undefined;
// }
    return new Promise((resolve: (value: { p: ChildProcess, stdout: (string | Buffer) }) => void, reject: (value: { p: ChildProcess, stderr: (string | Buffer) }) => void) => {
        let cmdStr = Array.isArray(cmd) ? cmd.join(' ') : cmd
        const p = exec(cmdStr, options, (error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => {
            if (stdout) resolve({ p, stdout })
            if (stderr) reject({ p, stderr })
            if (error) throw error
        })
    })
}