# Ruoyi-geek-electron

RuoYi-Geek-Electron旨在为RuoYi-Geek-SpringBoot3与RuoYi-Geek-Vue3搭建一个舒适的窗口应用环境，并用装饰器简化开发。

# 快速开始

```bash
$ npm install
```

### 启动

```bash
$ npm run dev
```

### 构建

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

# 绑定事件
```ts

class Test1Controller {

  // 相当于 ipcMain.on('test1',this.test1)
  @BindMapping('test1','on') 
  test1(_event,data){}

  // 相当于 ipcMain.handle('test2',this.test2)
  @BindMapping('test2','handle') 
  test2(_event,data){}

  // 相当于 ipcMain.handle('test3',this.test2)
  @BindMapping
  test3(_event,data){}
}

// 相当于
// ipcMain.handle('test4',Test2Controller.test1)
// ipcMain.handle('test5',Test2Controller.test1)
// 不会绑定静态方法
@BindMapping
class Test2Controller {
  test4(_event,data){}
  test5(_event,data){}
}

// 相当于
// ipcMain.on('beastest6',Test2Controller.test1)
// ipcMain.on('beastest7',Test2Controller.test1)
// 不会绑定静态方法
@BindMapping("beas","on")
class Test2Controller {
  test6(_event,data){}
  test7(_event,data){}
}

```
# 子线程
约定线程交互数据结构
```ts
{ 
    name: string, 
    value: any 
}
```
```ts
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

```