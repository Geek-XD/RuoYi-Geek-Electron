/* eslint-disable @typescript-eslint/ban-types */
import { Worker } from 'worker_threads';
export default class WorkerRunner extends Worker {
    public messageHandle: { [key: string]: Function } = {}
    constructor(filename: string | URL, options?: WorkerOptions) {
        super(filename, options);
        this.on('message', ({ name, value }) => {
            if (!(name in this.messageHandle)) throw new Error(`[worker][${filename}]:event "${name}" is not defined`)
            this.messageHandle[name](value)
        })
    }

    BIND = (fun: Function) => {
        this.messageHandle[fun.name] = fun;
    }
    bind(name: string): (targer: Function) => void
    bind(name: string, fun: Function): void
    bind(name: string, fun?: Function): ((targer: Function) => void) | void {
        if (fun) {
            this.messageHandle[name] = fun;
        } else {
            return (targer: Function) => {
                this.messageHandle[name] = targer;
            }
        }
    }
}