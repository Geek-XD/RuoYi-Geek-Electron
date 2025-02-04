export class PuppeteerNode {
  constructor(
    public xpath: string,
    public root: Document = document
  ) {}
  get nodes() {
    const xresult = this.root.evaluate(this.xpath, this.root, null, XPathResult.ANY_TYPE, null)
    const xnodes = new Array<Node>()
    let xres: Node | null = null
    while ((xres = xresult.iterateNext())) {
      xnodes.push(xres)
    }
    return xnodes
  }

  get node() {
    const xresult = this.root.evaluate(this.xpath, this.root, null, XPathResult.ANY_TYPE, null)
    return xresult.iterateNext()
  }
  get text() {
    const xresult = this.root.evaluate(
      this.xpath + '//text()',
      this.root,
      null,
      XPathResult.STRING_TYPE,
      null
    )
    return xresult.stringValue
  }

  get $nodes() {
    const xpath = this.xpath + '/*'
    const xresult = this.root.evaluate(xpath, this.root, null, XPathResult.ANY_TYPE, null)
    const xnodes = new Array<PuppeteerNode>()
    let index: number = 0
    while (xresult.iterateNext()) {
      xnodes.push(new PuppeteerNode(`(${xpath})[${++index}]`, this.root))
    }
    return xnodes
  }

  $x(xpath: string) {
    return Puppeteer.$x(this.xpath + xpath, this.root)
  }
}
export const Puppeteer = {
  input(element: HTMLInputElement, text: string) {
    element.focus()
    element.setSelectionRange(element.value.length, element.value.length)
    for (const char of text) {
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
  click(element: HTMLElement, button: 'left' | 'right' | 'middle' = 'left') {
    const eventInitDict = {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: { left: 1, middle: 2, right: 4 }[button],
      button: { left: 0, middle: 1, right: 2 }[button]
    }
    element.focus()
    element.dispatchEvent(new MouseEvent('click', eventInitDict))
  },
  // 文件上传
  uploadFile(upload: HTMLInputElement, fileList: FileList | string) {
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
    const xresult = DOCUMENT.evaluate(xpath, DOCUMENT, null, XPathResult.ANY_TYPE, null)
    const xnodes = new Array<PuppeteerNode>()
    let index: number = 0
    while (xresult.iterateNext()) {
      xnodes.push(new PuppeteerNode(`(${xpath})[${++index}]`, DOCUMENT))
    }
    return xnodes
  }
}
export class Performer {
  private steps: (() => Promise<void>)[] = []

  public time = 100

  public sleep(time: number) {
    this.steps.push(() => new Promise((resolve) => setTimeout(resolve, time)))
  }

  public step(fun: () => Promise<void>, time: number = this.time) {
    this.steps.push(fun)
    if (time) this.sleep(time)
    return this
  }
  public async run() {
    for (const step of this.steps) {
      await step()
    }
  }
}
