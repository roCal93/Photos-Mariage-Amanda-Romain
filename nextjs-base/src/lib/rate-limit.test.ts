import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit, getClientIpFromHeaders } from './rate-limit'

// Désactiver Upstash pour toujours tester le store local
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('checkRateLimit — store local (fallback sans Upstash)', () => {
  it('autorise la première requête', async () => {
    const result = await checkRateLimit({ key: 'rl-1', limit: 3, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
    expect(result.source).toBe('memory')
  })

  it("autorise les requêtes jusqu'à la limite", async () => {
    const key = 'rl-2'
    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit({ key, limit: 3, windowMs: 60_000 })
      expect(result.allowed).toBe(true)
    }
  })

  it('bloque les requêtes au-delà de la limite', async () => {
    const key = 'rl-3'
    for (let i = 0; i < 3; i++) {
      await checkRateLimit({ key, limit: 3, windowMs: 60_000 })
    }
    const result = await checkRateLimit({ key, limit: 3, windowMs: 60_000 })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('décrémente remaining correctement', async () => {
    const key = 'rl-4'
    const r1 = await checkRateLimit({ key, limit: 5, windowMs: 60_000 })
    expect(r1.remaining).toBe(4)
    const r2 = await checkRateLimit({ key, limit: 5, windowMs: 60_000 })
    expect(r2.remaining).toBe(3)
  })

  it('réinitialise le compteur après expiration de la fenêtre', async () => {
    const key = 'rl-5'
    for (let i = 0; i < 3; i++) {
      await checkRateLimit({ key, limit: 3, windowMs: 60_000 })
    }
    vi.advanceTimersByTime(60_001)
    const result = await checkRateLimit({ key, limit: 3, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('renvoie resetAt dans le futur', async () => {
    const now = Date.now()
    const result = await checkRateLimit({ key: 'rl-6', limit: 3, windowMs: 60_000 })
    expect(result.resetAt).toBeGreaterThan(now)
  })
})

describe('getClientIpFromHeaders', () => {
  it('retourne la première IP de x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIpFromHeaders(headers)).toBe('1.2.3.4')
  })

  it('retourne x-real-ip quand pas de x-forwarded-for', () => {
    const headers = new Headers({ 'x-real-ip': '9.9.9.9' })
    expect(getClientIpFromHeaders(headers)).toBe('9.9.9.9')
  })

  it('retourne "unknown" sans header IP', () => {
    expect(getClientIpFromHeaders(new Headers())).toBe('unknown')
  })
})
