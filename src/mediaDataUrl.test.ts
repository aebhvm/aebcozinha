import { describe, expect, it } from 'vitest'
import { dataUrlDecodedSize } from './mediaDataUrl'

describe('dataUrlDecodedSize', () => {
  it('calcula o tamanho quando o MIME do vídeo contém codecs separados por vírgula', () => {
    const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02, 0x03])
    const base64 = btoa(String.fromCharCode(...bytes))

    expect(dataUrlDecodedSize(`data:video/webm;codecs=vp8,opus;base64,${base64}`)).toBe(bytes.length)
  })

  it('rejeita conteúdo que não seja base64 completo', () => {
    expect(dataUrlDecodedSize('data:video/webm;base64,abc')).toBe(-1)
    expect(dataUrlDecodedSize('data:video/webm,AAAA')).toBe(-1)
  })
})
