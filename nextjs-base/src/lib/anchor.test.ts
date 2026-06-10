import { describe, expect, it } from 'vitest'
import { isSameBasePath } from './anchor'

describe('isSameBasePath', () => {
  it('retourne true pour des chemins identiques', () => {
    expect(isSameBasePath('/fr/a-propos', '/fr/a-propos')).toBe(true)
  })

  it('retourne true quand seul le hash diffère', () => {
    expect(isSameBasePath('/fr/contact#form', '/fr/contact#map')).toBe(true)
  })

  it('retourne true quand le chemin courant a un hash mais pas la cible', () => {
    expect(isSameBasePath('/fr/contact#form', '/fr/contact')).toBe(true)
  })

  it('retourne true quand la cible a un hash mais pas le chemin courant', () => {
    expect(isSameBasePath('/fr/contact', '/fr/contact#section')).toBe(true)
  })

  it('retourne false pour des chemins différents', () => {
    expect(isSameBasePath('/fr/a-propos', '/fr/contact')).toBe(false)
  })

  it('retourne false pour des chemins différents même avec le même hash', () => {
    expect(isSameBasePath('/fr/a-propos#section', '/fr/contact#section')).toBe(false)
  })
})
