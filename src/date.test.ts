import { describe, expect, it } from 'vitest'
import { addOneHour, formatDate } from './date'

describe('date helpers', () => {
  it('calcula intervalo de uma hora no mesmo dia', () => {
    expect(addOneHour('14:30')).toBe('15:30')
  })

  it('calcula intervalo cruzando meia-noite', () => {
    expect(addOneHour('23:15')).toBe('00:15')
  })

  it('formata datas em pt-BR', () => {
    expect(formatDate('2026-05-11')).toContain('11/05/2026')
  })
})
