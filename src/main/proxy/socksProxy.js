const { createServer } = require("node:http");
const { parse } = require("node:url");
const { SocksClient } = require("socks");

// 连接池管理
const connectionPool = new Map();

// 错误处理
function errorHandler(clientSocket, proxySocket) {
    return (err) => {
        clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
        clientSocket.end("Proxy socket error: " + err.message);
        clientSocket.destroy();
        proxySocket?.destroy();
        console.error("Socks Proxy Socket Error: ", err.message);
    };
}

/**
 * @description 创建SOCKS代理服务器
 * @param {string} proxyRules 代理地址 [socks4/5]://[userId]:[password]@[host]:[port]
 * @returns {Promise<{url: string, close: () => Promise<void>}>} 包含本地代理地址和关闭方法
 */
export async function sockProxyRules(proxyRules) {
    const proxyRulesList = proxyRules.match(
        /socks(\d+):\/\/(.*):(.*?)@(.*):(\d+)/
    );

    if (!proxyRulesList) return Promise.reject("Invalid proxy rules.");

    const [, type, userId, password, host, port] = proxyRulesList;
    const socksOptions = {
        proxy: {
            host,
            port: Number.parseInt(port),
            type: Number.parseInt(type),
            userId,
            password,
        },
        command: "connect",
        destination: { host: "", port: 0 },
    };

    let httpServer;
    const activeSockets = new Set();

    // 创建HTTP服务器
    httpServer = createServer(async (req, res) => {
        if (!req.url) return;

        const urlObject = parse(req.url);
        if (!urlObject.hostname) return;

        socksOptions.destination.host = urlObject.hostname;
        socksOptions.destination.port = Number.parseInt(urlObject.port || "80");

        try {
            const key = `${urlObject.hostname}:${socksOptions.destination.port}`;
            let socket;

            // 尝试从连接池获取
            if (connectionPool.has(key)) {
                socket = connectionPool.get(key);
                if (socket.destroyed) {
                    connectionPool.delete(key);
                    socket = (await SocksClient.createConnection(socksOptions)).socket;
                }
            } else {
                const result = await SocksClient.createConnection(socksOptions);
                socket = result.socket;
            }

            // 加入活动连接集合
            activeSockets.add(socket);

            socket.once('close', () => {
                activeSockets.delete(socket);
                connectionPool.delete(key);
            });

            // 设置超时（30秒）
            socket.setTimeout(30000, () => {
                socket.destroy();
                connectionPool.delete(key);
            });

            req.pipe(socket);
            socket.pipe(res);

            // 请求结束后放回连接池
            res.on('finish', () => {
                if (!socket.destroyed) {
                    connectionPool.set(key, socket);
                }
            });

        } catch (error) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Proxy request error: " + error.message);
        }
    });

    // 处理HTTPS CONNECT请求
    httpServer.on(
        "connect",
        async (req, clientSocket, head) => {
            const parsedUrl = parse("https://" + (req.url || ""));
            const { hostname, port } = parsedUrl;
            if (!hostname || !port) {
                clientSocket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
                return;
            }

            socksOptions.destination.host = hostname;
            socksOptions.destination.port = Number.parseInt(port);

            try {
                const { socket } = await SocksClient.createConnection(socksOptions);
                activeSockets.add(socket);

                clientSocket.on("error", errorHandler(clientSocket, socket));
                socket.on("error", errorHandler(clientSocket, socket));
                socket.on('close', () => activeSockets.delete(socket));

                clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
                socket.write(head);

                socket.pipe(clientSocket);
                clientSocket.pipe(socket);
            } catch (error) {
                errorHandler(clientSocket)(error);
            }
        }
    );

    httpServer.on("error", (error) => {
        console.error("Socks Proxy Server Error: ", error.message);
    });

    // 启动服务器
    const randomPort = Math.floor(1e4 * Math.random()) + 5e4;
    await new Promise((resolve) => {
        httpServer.listen(randomPort, resolve);
    });

    return {
        url: `http://127.0.0.1:${randomPort}`,
        close: async () => {
            return new Promise((resolve) => {
                // 关闭所有活动连接
                activeSockets.forEach(socket => socket.destroy());
                activeSockets.clear();
                connectionPool.clear();

                // 关闭服务器
                httpServer.close(() => resolve());
            });
        }
    };
}