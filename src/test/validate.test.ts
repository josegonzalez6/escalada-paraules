import { describe, it, expect } from 'vitest'
import { validateLadder } from '../utils/validate'

// Chain: mar -> mara -> maras -> marasa -> marasas (all canFollow verified)
const dict = new Set([
  'mar', 'mara', 'maras', 'marasa', 'marasas',
  'sol', 'sols', 'soles', 'soler', 'solera', 'soleras',
  'marc', 'marca', 'marcar', 'marcats',
])

const solution = ['mar', 'mara', 'maras', 'marasa', 'marasas']

describe('validateLadder', () => {
  it('validates a correct ladder', () => {
    const result = validateLadder(
      'mar',
      ['mara', 'maras', 'marasa', 'marasas'] as [string, string, string, string],
      dict,
      solution,
      'es'
    )
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('catches empty fields', () => {
    const result = validateLadder(
      'mar',
      ['', '', '', ''] as [string, string, string, string],
      dict,
      solution,
      'es'
    )
    expect(result.success).toBe(false)
    expect(result.errors[0].reason).toBe('empty')
  })

  it('catches word not in dictionary', () => {
    const result = validateLadder(
      'mar',
      ['marx', 'maras', 'marasa', 'marasas'] as [string, string, string, string],
      dict,
      solution,
      'es'
    )
    expect(result.success).toBe(false)
    expect(result.errors.some(e => e.reason === 'not_in_dictionary')).toBe(true)
  })

  it('catches missing letters from previous word', () => {
    // marc(4) -> solera(6): wrong length + missing letters
    const result = validateLadder(
      'mar',
      ['marc', 'gatos', 'marasa', 'marasas'] as [string, string, string, string],
      dict,
      solution,
      'es'
    )
    expect(result.success).toBe(false)
    // gatos (5 letters) doesn't contain all letters of marc (m,a,r,c)
    expect(result.errors.some(e => e.step === 2)).toBe(true)
  })

  it('catches wrong length', () => {
    // 'sols' has 4 letters but step 2 expects 5
    const result = validateLadder(
      'sol',
      ['sols', 'sols', 'solera', 'soleras'] as [string, string, string, string],
      dict,
      solution,
      'es'
    )
    expect(result.success).toBe(false)
    expect(result.errors.some(e => e.reason === 'wrong_length')).toBe(true)
  })
})
