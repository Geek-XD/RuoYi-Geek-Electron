const { createServer } = require('node:http')
const net = require('node:net')
const { URL } = require('node:url')

class ProxyServer {
  constructor(proxyRules) {
    this.proxyRules = proxyRules
    this.activeSockets = new Set()
    this.parseProxyRules()
  }

  parseProxyRules() {
    const proxyRulesList =
      this.proxyRules.match(/http:\/\/(.*):(.*?)@(.*):(\d+)/) ||
      this.proxyRules.match(/http:\/\/([^:@]*)(?::([^@]*))?@(.*):(\d+)/)

    if (!proxyRulesList) throw new Error('Invalid proxy rules format')

    const [, userId, password, host, port] = proxyRulesList
    this.proxyConfig = {
      host,
      port: Number(port),
      authHeader: userId ? `Basic ${Buffer.from(`${userId}:${password}`).toString('base64')}` : null
    }
  }

  async start() {
    this.server = createServer(this.handleHttpRequest.bind(this))
    this.server.on('connect', this.handleHttpsConnect.bind(this))

    // 使用0让系统自动分配端口
    this.server.listen(0)

    return new Promise((resolve) => {
      this.server.on('listening', () => {
        this.port = this.server.address().port
        resolve({
          url: `http://127.0.0.1:${this.port}`,
          close: this.close.bind(this)
        })
      })
    })
  }

  async handleHttpRequest(req, res) {
    try {
      const url = this.getRequestUrl(req)
      const target = new URL(url)

      const socket = await this.createProxyConnection()

      // 构造请求头
      const headers = this.buildHeaders(req, target)

      // 发送请求
      const requestLine = `${req.method} ${target.pathname}${target.search || ''} HTTP/1.1\r\n`
      socket.write(requestLine + headers + '\r\n')

      // 处理响应
      let responseHeaders = null
      let buffer = Buffer.alloc(0)

      socket.on('data', (data) => {
        buffer = Buffer.concat([buffer, data])

        if (!responseHeaders) {
          const headerEnd = buffer.indexOf('\r\n\r\n')
          if (headerEnd !== -1) {
            responseHeaders = buffer.slice(0, headerEnd).toString()
            const [statusLine, ...headerLines] = responseHeaders.split('\r\n')
            const statusCode = parseInt(statusLine.split(' ')[1], 10)

            // 写入响应头
            const headers = headerLines.reduce((acc, line) => {
              const [key, value] = line.split(': ')
              if (key && value) acc[key] = value
              return acc
            }, {})

            res.writeHead(statusCode, headers)

            // 写入剩余数据
            const body = buffer.slice(headerEnd + 4)
            if (body.length > 0) {
              res.write(body)
            }
          }
        } else {
          res.write(data)
        }
      })

      socket.on('end', () => res.end())
      socket.on('error', (err) => this.handleProxyError(res, err))

      req.pipe(socket)
    } catch (error) {
      this.handleRequestError(res, error)
    }
  }

  async handleHttpsConnect(req, clientSocket, head) {
    try {
      const [targetHost, targetPort] = req.url.split(':')
      const socket = await this.createProxyConnection()

      // 发送CONNECT请求
      await this.sendConnectRequest(socket, targetHost, targetPort)

      clientSocket.on('error', (err) => this.handleSocketError(clientSocket, socket, err))
      socket.on('error', (err) => this.handleSocketError(clientSocket, socket, err))

      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      socket.write(head)

      socket.pipe(clientSocket)
      clientSocket.pipe(socket)
    } catch (error) {
      this.handleSocketError(clientSocket, null, error)
    }
  }

  async createProxyConnection() {
    const socket = net.createConnection({
      host: this.proxyConfig.host,
      port: this.proxyConfig.port
    })

    this.activeSockets.add(socket)
    socket.once('close', () => this.activeSockets.delete(socket))

    await new Promise((resolve, reject) => {
      socket.once('connect', resolve)
      socket.once('error', reject)
    })

    return socket
  }

  getRequestUrl(req) {
    if (req.url.startsWith('http')) return req.url
    return `http://${req.headers.host}${req.url}`
  }

  buildHeaders(req, targetUrl) {
    const headers = {
      ...req.headers,
      Host: `${targetUrl.hostname}:${targetUrl.port || 80}`,
      Connection: 'close'
    }

    if (this.proxyConfig.authHeader) {
      headers['Proxy-Authorization'] = this.proxyConfig.authHeader
    }

    delete headers['proxy-connection']

    return Object.entries(headers)
      .map(([k, v]) => `${k}: ${v}\r\n`)
      .join('')
  }

  async sendConnectRequest(socket, host, port) {
    const connectRequest =
      `CONNECT ${host}:${port} HTTP/1.1\r\n` +
      `Host: ${host}:${port}\r\n` +
      (this.proxyConfig.authHeader
        ? `Proxy-Authorization: ${this.proxyConfig.authHeader}\r\n`
        : '') +
      `\r\n`

    return new Promise((resolve, reject) => {
      let responseData = ''
      const onData = (data) => {
        responseData += data.toString()
        if (responseData.includes('\r\n\r\n')) {
          socket.removeListener('data', onData)
          if (responseData.match(/^HTTP\/\d\.\d 200/)) {
            resolve()
          } else {
            reject(new Error(`Proxy refused connection: ${responseData.split('\r\n')[0]}`))
          }
        }
      }

      socket.on('data', onData)
      socket.once('error', reject)
      socket.write(connectRequest)
    })
  }

  handleProxyError(res, err) {
    console.error('Proxy connection error:', err)
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Proxy connection error')
  }

  handleRequestError(res, error) {
    console.error('Proxy error:', error)
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Proxy request error: ' + error.message)
  }

  handleSocketError(clientSocket, proxySocket, error) {
    clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n')
    clientSocket.end('Proxy socket error: ' + error.message)
    clientSocket.destroy()
    proxySocket?.destroy()
    console.error('HTTP Proxy Socket Error: ', error.message)
  }

  async close() {
    return new Promise((resolve) => {
      this.activeSockets.forEach((s) => s.destroy())
      this.activeSockets.clear()
      this.server.close(() => resolve())
    })
  }
}

export async function httpProxyRules(proxyRules) {
  const proxy = new ProxyServer(proxyRules)
  return proxy.start()
}
