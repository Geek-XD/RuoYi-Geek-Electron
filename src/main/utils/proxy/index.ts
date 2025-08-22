const https = require('https');
const zlib = require("zlib");



/**
 * 获取代理地址
 */
export function getProxyUrl(getAddress: string, username: string, password: string) {
    const base64 = Buffer.from(username + ":" + password).toString("base64");
    return new Promise<{ proxyIp: string; proxyPort: string }>((resolve, reject) => {
        https.get(getAddress, {
            headers: {
                'Authorization': 'Basic ' + base64
            }
        }, (res) => {
            let stream = res;
            if (res.headers['content-encoding'] && res.headers['content-encoding'].toLowerCase() === 'gzip') {
                stream = stream.pipe(zlib.createGunzip());
            }

            let rawData = '';
            stream.on('data', (chunk) => {
                rawData += chunk;
            });

            stream.on('end', () => {
                try {
                    const data = rawData.toString().trim();
                    console.log('原始代理数据:', data);
                    const parts = data.split(':');
                    if (parts.length >= 2) {
                        const proxyIp = parts[0];
                        const portMatch = parts[1].match(/^\d+/);
                        if (portMatch && portMatch[0]) {
                            const proxyPort = portMatch[0];
                            resolve({ proxyIp, proxyPort });
                        } else {
                            console.error('解析代理端口失败 from data:', parts[1]);
                            reject(new Error('解析代理端口失败'));
                        }
                    } else {
                        console.error('解析代理数据失败, 格式不正确:', data);
                        reject(new Error('解析代理数据失败'));
                    }
                } catch (e) {
                    console.error('处理代理数据时出错:', e);
                    reject(e);
                }
            });

            stream.on('error', (streamErr) => {
                console.error('代理信息响应流错误:', streamErr);
                reject(streamErr);
            });
        }).on('error', (err) => {
            console.error('获取代理地址请求失败:', err);
            reject(err);
        });
    });
}


import { httpProxyRules } from './httpProxy';
import { sockProxyRules } from './socksProxy';

type HttpProxyUrl = `http://${string}:${string}@${string}:${string}`;
type SocksProxyUrl = `socks${4 | 5}://${string}:${string}@${string}:${string}`;
const proxy: {
    // "[http]://[userId]:[password]@[host]:[port]"
    httpProxyRules: (proxyRules: HttpProxyUrl) => Promise<{ url: string }>;
    // "[socks4/5]://[userId]:[password]@[host]:[port]"
    sockProxyRules: (proxyRules: SocksProxyUrl) => Promise<{ url: string }>;
} = {
    httpProxyRules,
    sockProxyRules
}

export default proxy

// const ses = session.defaultSession;

// const getAddress = "https://dps.kdlapi.com/api/getdps/?secret_id=oeed9sernk9zd0f58hes&signature=485j8hlu6lvhnituo33hdc0oqobhsqi0&num=1&pt=1&format=text&sep=1";
// const username = "d4287458353";
// const password = "b67027bd";
// const { proxyIp, proxyPort } = await getProxyUrl(getAddress, username, password);
// const proxyRules = await proxy.httpProxyRules(`http://${username}:${password}@${proxyIp}:${proxyPort}`);


// const proxyIp = 'c377.kdltps.com';
// const proxyPort = '20818';
// const username = "t14877819288635"
// const password = "jb1u8onz"
// const proxyRules = await proxy.sockProxyRules(`socks5://${username}:${password}@${proxyIp}:${proxyPort}`);


// ses.setProxy({ proxyRules: proxyRules.url });