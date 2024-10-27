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

/*
// 约定线程交互数据结构：
// { name: string, value: any }

const xxWorkerRunner = new WorkerRunner(pathDir);
// WorkerRunner继承了Worker ， 有Worker的所有方法
// 增加了装饰器的方式绑定事件
class XXWorkerRunner{

    // 相当于 xxWorkerRunner.bind('test',this.test)
    @xxWorkerRunner.bind('test1')
    test(){}

    // 相当于 xxWorkerRunner.bind('test2',this.test2)
    @xxWorkerRunner.BIND
    test2(){}
}

function test3(){}
xxWorkerRunner.bind('test3', test3)

*/