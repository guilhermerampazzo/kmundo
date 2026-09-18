export function parseValorMoeda(input: string, moeda?: string): number {
  const raw = (input ?? '').trim()
  if (!raw) return 0
  const limpo = raw.replace(/[^\d.,-]/g, '')
  if (!limpo) return 0
  if (moeda === 'KRW') {
    const digitos = limpo.replace(/[^\d-]/g, '')
    const n = parseInt(digitos, 10)
    return Number.isNaN(n) ? NaN : n
  }
  const temPonto = limpo.includes('.')
  const temVirgula = limpo.includes(',')
  let normalizado: string
  if (temPonto && temVirgula) {
    normalizado = limpo.replace(/\./g, '').replace(',', '.')
  } else if (temVirgula) {
    normalizado = limpo.replace(',', '.')
  } else if (temPonto) {
    const partes = limpo.split('.')
    const ultimo = partes[partes.length - 1]
    if (partes.length > 2 || ultimo.length === 3) {
      normalizado = limpo.replace(/\./g, '')
    } else {
      normalizado = limpo
    }
  } else {
    normalizado = limpo
  }
  const n = parseFloat(normalizado)
  return n
}

export function formatarMoeda(valor: number, moeda: string): string {
  if (moeda === 'KRW') return `${Math.round(valor).toLocaleString('en-US')} ${moeda}`
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moeda}`
}
