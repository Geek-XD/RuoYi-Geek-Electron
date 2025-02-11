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

    BIND = (_target: object, atta: string, sym: TypedPropertyDescriptor<(...args: any[]) => any>) => {
        const originalMethod = sym.value;
        if (typeof originalMethod === 'function') {
            this.messageHandle[atta] = originalMethod;
        } else {
            throw new Error(`[worker]: Method "${atta}" is not a function`);
        }
    };
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

