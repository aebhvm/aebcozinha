import { describe, expect, it } from 'vitest'
import { base64DataUrlToBlob, dataUrlDecodedSize, normalizeBase64DataUrl, normalizeMediaMimeType } from './mediaDataUrl'

describe('normalização de MIME de mídia', () => {
  it('remove codecs que quebram data URLs por conterem vírgula', () => {
    expect(normalizeMediaMimeType('video/webm;codecs=vp8,opus')).toBe('video/webm')
    expect(normalizeBase64DataUrl('data:video/webm;codecs=vp8,opus;base64,AAAA', 'video/webm;codecs=vp8,opus'))
      .toBe('data:video/webm;base64,AAAA')
  })
})

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

describe('conversão de dados locais sem requisição de rede', () => {
  it('preserva os bytes e o MIME, inclusive MIME com codecs', async () => {
    const blob = base64DataUrlToBlob('data:video/webm;codecs=vp8,opus;base64,AQID', 'video/webm;codecs=vp8,opus')
    expect(blob.type).toBe('video/webm')
    expect(blob.size).toBe(3)
    const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(blob)
    })
    expect([...new Uint8Array(bytes)]).toEqual([1, 2, 3])
  })
  it('rejeita arquivos incompletos e conteúdo externo', () => {
    expect(() => base64DataUrlToBlob('data:image/png;base64,ABC', 'image/png')).toThrow()
    expect(() => base64DataUrlToBlob('https://example.invalid/file', 'image/png')).toThrow()
  })
})
