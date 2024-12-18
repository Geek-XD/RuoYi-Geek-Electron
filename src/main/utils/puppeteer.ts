class PuppeteerNode {
  constructor(
    private xpath: string,
    public root: Document = document
  ) {}
  get nodes() {
    const xresult = this.root.evaluate(this.xpath, this.root, null, XPathResult.ANY_TYPE, null)
    let xnodes = new Array<Node>()
    let xres: Node | null = null
    while ((xres = xresult.iterateNext())) {
      xnodes.push(xres)
    }
    return xnodes
  }
  get text() {
    const xresult = this.root.evaluate(
      this.xpath + '/text()',
      this.root,
      null,
      XPathResult.STRING_TYPE,
      null
    )
    return xresult.stringValue
  }
  $x(xpath: string) {
    return new PuppeteerNode(this.xpath + xpath, this.root)
  }
}
const Puppeteer = {
  input(element: HTMLInputElement, text: string) {
    element.focus()
    element.setSelectionRange(element.value.length, element.value.length)
    for (let char of text) {
      element.setRangeText(char, element.value.length, element.value.length, 'end')
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          bubbles: true,
          cancelable: true,
          key: char,
          code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0)
        })
      )
      element.dispatchEvent(
        new KeyboardEvent('keypress', {
          bubbles: true,
          cancelable: true,
          key: char,
          code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0)
        })
      )
      element.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          data: char
        })
      )
      element.dispatchEvent(
        new KeyboardEvent('keyup', {
          bubbles: true,
          cancelable: true,
          key: char,
          code: char === ' ' ? 'Space' : `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0)
        })
      )
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
    element.blur()
    element.dispatchEvent(new Event('blur', { bubbles: true }))
  },
  // 模拟点击
  click(
    element: HTMLElement,
    eventInitDict: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: 1, 	// 1 表示左键按下。    2 表示中键（滚轮按钮）按下。     4 表示右键按下。
      button: 0 	// 0 表示左键。        1 表示中键（滚轮按钮）。        2 表示右键。
    }
  ) {
    element.focus()
    element.dispatchEvent(new MouseEvent('click', eventInitDict))
  },
  // 文件上传
  fileUpload(upload: HTMLInputElement, fileList: FileList) {
    if (!upload || upload.type !== 'file') {
      throw new Error('The provided element is not a valid file input element.')
    }
    if (!(fileList instanceof FileList)) {
      throw new Error('The provided fileList is not a valid FileList object.')
    }
    upload.files = fileList
    upload.dispatchEvent(new Event('change', { bubbles: true }))
  },
  // 拖拽文件上传
  dropFile(container: HTMLElement, file: File) {
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    container.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      })
    )
  },
  $x(xpath: string, DOCUMENT: Document = document) {
    return new PuppeteerNode(xpath, DOCUMENT)
  }
}

// 操作
export class Operation {
  constructor(
    public xpath: string,
    public index: number | null,
    public operation: Exclude<keyof typeof Puppeteer, '$x'>,
    public args: string | undefined | File | FileList
  ) {}
}

export class Controller {
  public operations: Operation[] = []
  constructor(public root: Document = document) {}
  push(operation: Operation) {
    this.operations.push(operation)
    return this
  }

  run() {
    for (let operation of this.operations) {
      const puppeteerNode = new PuppeteerNode(operation.xpath, this.root)
      const method = Puppeteer[operation.operation]
      if (operation.index !== null) {
        const node = puppeteerNode.nodes[operation.index]
        method(node as any, operation.args as any)
      } else {
        for (let node of puppeteerNode.nodes) {
          method(node as any, operation.args as any)
        }
      }
    }
  }
}

export default Puppeteer
