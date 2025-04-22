import { machineIdSync } from 'node-machine-id'
import crypto from 'crypto'
import fs from 'fs'
export function generateKeyPairSync() {
  // 生成 2048 位 RSA 密钥对
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicExponent: 65537,
    publicKeyEncoding: {
      type: 'spki', // 公钥格式（X.509/SPKI）
      format: 'pem' // PEM 编码
    },
    privateKeyEncoding: {
      type: 'pkcs8', // 私钥格式（PKCS#8）
      format: 'pem'
    }
  })

  // 保存密钥（实际场景需安全存储，如密钥管理系统）
  fs.writeFileSync('public.key', publicKey)
  fs.writeFileSync('private.key', privateKey)
}

export function encryptMachineId() {
  const machineId = machineIdSync()
  const buffer = Buffer.from(machineId)
  const publicKey = fs.readFileSync('public.key')
  const encryptedMachineId = crypto.publicEncrypt(publicKey, buffer).toString('base64')
  return encryptedMachineId
}

export function decryptMachineId(encryptedMachineId: string) {
  const machineId = machineIdSync()
  const buffer = Buffer.from(encryptedMachineId, 'base64')
  const privateKey = fs.readFileSync('private.key')
  const decryptedMachineId = crypto.privateDecrypt(privateKey, buffer).toString('utf-8')
  return decryptedMachineId === machineId ? true : false
}
