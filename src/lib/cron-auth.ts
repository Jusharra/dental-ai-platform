import { timingSafeEqual } from 'crypto'

/**
 * Constant-time string comparison to prevent timing attacks.
 * If lengths differ, still runs a dummy comparison to maintain
 * uniform execution time, then returns false.
 */
export function safeEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a)
    const bBuf = Buffer.from(b)
    if (aBuf.length !== bBuf.length) {
      timingSafeEqual(Buffer.alloc(aBuf.length), Buffer.alloc(aBuf.length))
      return false
    }
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}
