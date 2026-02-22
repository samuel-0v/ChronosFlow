/**
 * Retorna a data local no formato 'YYYY-MM-DD'.
 * Evita o bug de `new Date().toISOString().split('T')[0]` que
 * converte para UTC e pode retornar o dia anterior/seguinte
 * dependendo do fuso horário.
 */
export function getLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Retorna Date com hora local 00:00:00.000 convertida para
 * string ISO UTC — útil para queries gte/lte no Supabase
 * que armazenam timestamptz.
 */
export function localMidnightISO(date: Date = new Date()): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Extrai 'YYYY-MM-DD' local de uma string ISO (timestamptz).
 * Converte para Date primeiro para respeitar o fuso do browser.
 */
export function isoToLocalDate(iso: string): string {
  return getLocalISODate(new Date(iso))
}

/**
 * Formata segundos em HH:MM:SS.
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':')
}

/**
 * Formata segundos em texto curto legível (ex: "3h 20m").
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours === 0 && minutes === 0) return '0m'
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
