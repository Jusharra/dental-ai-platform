import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'enc:v1:'

function getKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY ?? ''
  if (hex.length !== 64) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32')
  }
  return Buffer.from(hex, 'hex')
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a prefixed string: enc:v1:<iv>:<tag>:<ciphertext> (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts a value produced by encrypt().
 * If the value is not prefixed (legacy plaintext), returns it as-is.
 * Returns null for null/undefined/empty inputs.
 */
export function decrypt(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith(PREFIX)) return value // plaintext / legacy

  const parts = value.slice(PREFIX.length).split(':')
  if (parts.length !== 3) return null

  try {
    const key = getKey()
    const [ivHex, tagHex, dataHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const data = Buffer.from(dataHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    return decipher.update(data, undefined, 'utf8') + decipher.final('utf8')
  } catch {
    return null
  }
}

/**
 * Serialize a value to JSON then encrypt it.
 * Use for JSONB fields (medical_conditions, allergies, medications).
 */
export function encryptJson(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return encrypt(JSON.stringify(value))
}

/**
 * Decrypt and parse a JSON-encrypted value.
 * Returns null if missing or decryption fails.
 */
export function decryptJson<T = unknown>(value: string | null | undefined): T | null {
  const plaintext = decrypt(value)
  if (!plaintext) return null
  try {
    return JSON.parse(plaintext) as T
  } catch {
    return null
  }
}
