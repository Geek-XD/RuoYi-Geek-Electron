import { exec, ExecException, ExecOptions, spawn, SpawnOptions } from 'child_process';
import { ObjectEncodingOptions } from 'node:fs';
type Args = string[] | { [key: string]: (string | number | null | undefined | boolean) }
type Parse = {
    joinKeyValue?: string,
    beforKey?: string
}
function parseArgs(args: Args, options?: Parse) {
    if (Array.isArray(args)) {
        return args.join(' ')
    } else {
        const argList: string[] = []
        const beforKey: string = options ? options.beforKey || '' : ''
        const joinKeyValue: string = options ? options.joinKeyValue || ' ' : ' '
        for (const key in args) {
            if (args[key] === null || args[key] === undefined) {
                argList.push(`${beforKey}${key}`)
            } else if (typeof args[key] !== 'object' && typeof args[key] !== 'function') {
                argList.push(`${beforKey}${key}${joinKeyValue}${args[key]}`)
            }
        }
        return argList.join(' ')
    }
}
export function runExec(cmd: string | string[], args?: Args, options?: (ObjectEncodingOptions & ExecOptions & Parse) | null, callback?: ((error: ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => void)) {
    const cmdStr = Array.isArray(cmd) ? cmd.join(' ') : cmd
    if (args) cmdStr + " " + parseArgs(args)
    return exec(cmdStr, options, callback)
}

export function runSpawn(cmd: string | string[], args?: Args, options: SpawnOptions & Parse = {}) {
    const cmdStr = Array.isArray(cmd) ? cmd.join(' ') : cmd
    if (args) cmdStr + " " + parseArgs(args)
    return spawn(cmdStr, options)
}

// runtime\\python.exe -m api_v2 -a 127.0.0.1 -p
// fun("runtime\\python.exe",{"-m":"api_v2","-a":"127.0.0.1","-p":null})
// fun("runtime\\python.exe",["-m", "api_v2", "-a", "127.0.0.1", "-p"])
// fun(["runtime\\python.exe", "-m", "api_v2", "-a", "127.0.0.1", "-p"])