import { machineIdSync } from 'node-machine-id'
import crypto from 'crypto'
import fs from 'fs'
import { app } from 'electron'
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

const signaturePath = app.getPath('userData') + '/signature.txt'

/**
 * 私钥存在管理端，用于签名授权文件
 * @returns
 */
export function encryptMachineId(machineId: string) {
  const buffer = Buffer.from(machineId)
  const privateKey = fs.readFileSync('private.key', 'utf-8')
  const encryptedMachineId = crypto.privateEncrypt(privateKey, buffer).toString('base64')
  return encryptedMachineId
}

/** 
 * 公钥存在客户端，用于验签授权文件
 */
export function decryptMachineId() {
  const machineId = machineIdSync()
  const signature = fs.readFileSync(signaturePath, 'utf-8')
  const buffer = Buffer.from(signature, 'base64')
  const publicKey = fs.readFileSync('public.key', 'utf-8')
  const decryptedMachineId = crypto.publicDecrypt(publicKey, buffer).toString('utf-8')
  return decryptedMachineId === machineId ? true : false
}
