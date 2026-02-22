import { useState } from 'react'
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  PauseCircle,
  Pencil,
  Check,
  X as XIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui'
import { formatTime } from '@/lib/formatTime'
import type { GroupedEntries, TimeEntryWithDetails, Pause } from '@/types'

// ----- Props -----

interface TimesheetListProps {
  groupedEntries: GroupedEntries
  emptyLabel?: string
  emptyHint?: string
  /** Chamado após edição bem-sucedida de end_time */
  onEntryUpdated?: () => void
}

// ----- Helpers -----

/** Soma total_duration de um array de entries */
function sumDuration(entries: TimeEntryWithDetails[]): number {
  return entries.reduce((acc, e) => acc + (e.total_duration ?? 0), 0)
}

/** Formata 'YYYY-MM-DD' → 'Sexta, 21 de fev. de 2026' */
function formatDayLabel(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Formata ISO date string → 'HH:MM' */
function formatHour(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Calcula duração em segundos entre duas datas ISO */
function pauseDuration(start: string, end: string | null): number {
  if (!end) return 0
  return Math.floor(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000,
  )
}

// ----- Acordeão de Pausas -----

function PauseAccordion({ pauses }: { pauses: Pause[] }) {
  if (pauses.length === 0) {
    return (
      <p className="py-2 pl-6 text-[11px] italic text-slate-600">
        Nenhuma pausa registrada nesta sessão.
      </p>
    )
  }

  return (
    <div className="mt-1 space-y-1 pl-6">
      {pauses.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 rounded-lg bg-slate-800/40 px-3 py-1.5 text-[11px]"
        >
          <PauseCircle className="h-3 w-3 shrink-0 text-amber-500/60" />
          <span className="text-slate-500">
            {formatHour(p.start_time)}
            {' — '}
            {p.end_time ? formatHour(p.end_time) : 'em aberto'}
          </span>
          {p.reason && (
            <>
              <span className="text-slate-700">·</span>
              <span className="truncate text-slate-400">{p.reason}</span>
            </>
          )}
          <span className="ml-auto shrink-0 font-mono text-slate-500">
            {p.end_time
              ? formatTime(pauseDuration(p.start_time, p.end_time))
              : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ----- Linha de sessão no modal -----

function SessionRow({
  entry,
  onEntryUpdated,
}: {
  entry: TimeEntryWithDetails
  onEntryUpdated?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const hasPauses = entry.pauses.length > 0

  const canEdit = entry.end_time !== null

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!entry.end_time) return
    // Preencher com o HH:MM atual do end_time
    const d = new Date(entry.end_time)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    setEditValue(`${hh}:${mm}`)
    setEditError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setIsEditing(false)
    setEditError(null)
  }

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!entry.end_time) return

    const [hStr, mStr] = editValue.split(':')
    const hours = Number(hStr)
    const minutes = Number(mStr)

    if (isNaN(hours) || isNaN(minutes)) {
      setEditError('Horário inválido.')
      return
    }

    // Construir novo end_time mantendo a mesma data base
    const original = new Date(entry.end_time)
    const newEnd = new Date(original)
    newEnd.setHours(hours, minutes, 0, 0)

    const startDate = new Date(entry.start_time)

    // Validação: deve ser > start_time
    if (newEnd.getTime() <= startDate.getTime()) {
      setEditError('Deve ser posterior ao início.')
      return
    }

    // Validação: só pode reduzir (não aumentar)
    if (newEnd.getTime() > original.getTime()) {
      setEditError('Só é permitido reduzir o horário.')
      return
    }

    // Recalcular total_duration (em segundos), descontando pausas
    let pauseSeconds = 0
    for (const p of entry.pauses) {
      if (p.end_time) {
        const pStart = new Date(p.start_time).getTime()
        const pEnd = new Date(p.end_time).getTime()
        // Só contar pausas que ainda cabem no novo intervalo
        const effectiveStart = Math.max(pStart, startDate.getTime())
        const effectiveEnd = Math.min(pEnd, newEnd.getTime())
        if (effectiveEnd > effectiveStart) {
          pauseSeconds += Math.floor((effectiveEnd - effectiveStart) / 1000)
        }
      }
    }

    const totalSeconds = Math.floor(
      (newEnd.getTime() - startDate.getTime()) / 1000,
    ) - pauseSeconds

    setIsSaving(true)

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: newEnd.toISOString(),
        total_duration: Math.max(totalSeconds, 0),
      })
      .eq('id', entry.id)

    setIsSaving(false)

    if (error) {
      console.error('[TimesheetList] Erro ao atualizar end_time:', error.message)
      setEditError('Erro ao salvar.')
      return
    }

    setIsEditing(false)
    setEditError(null)
    onEntryUpdated?.()
  }

  return (
    <div className={`rounded-xl border bg-slate-950/40 ${isEditing ? 'border-primary-500/40' : 'border-slate-800'}`}>
      {/* Linha principal clicável */}
      <button
        type="button"
        onClick={() => !isEditing && setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/30"
      >
        {/* Chevron */}
        <span className="shrink-0 text-slate-600">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>

        {/* Horário */}
        <span className="shrink-0 text-xs text-slate-400">
          {formatHour(entry.start_time)}
          {' — '}
          {entry.end_time ? formatHour(entry.end_time) : 'em aberto'}
        </span>

        {/* Categoria */}
        {entry.categories ? (
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.categories.color_hex }}
            />
            <span className="text-slate-300">{entry.categories.name}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}

        {/* Tarefa */}
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
          {entry.tasks ? entry.tasks.title : ''}
        </span>

        {/* Duração */}
        <span className="shrink-0 font-mono text-xs text-slate-300">
          {entry.total_duration != null ? formatTime(entry.total_duration) : '—'}
        </span>

        {/* Badge pausas */}
        {hasPauses && (
          <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
            {entry.pauses.length}
          </span>
        )}

        {/* Botão editar — fica na linha principal */}
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-700 hover:text-slate-300 active:bg-slate-600"
            title="Editar fim"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </button>

      {/* Painel de edição expandido */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isEditing ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-dashed border-primary-500/30 px-4 py-3 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor={`edit-end-${entry.id}`} className="block text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Horário de término
            </label>
            <input
              id={`edit-end-${entry.id}`}
              type="time"
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value)
                setEditError(null)
              }}
              className="block w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
            />
          </div>

          {editError && (
            <p className="text-[11px] text-red-400">{editError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700"
            >
              <XIcon className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-600 text-sm font-medium text-white transition-colors hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Pausas (acordeão com animação) */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded && !isEditing ? 'max-h-[500px] opacity-100 pb-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-dashed border-slate-800 px-4 pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Pausas
          </p>
          <PauseAccordion pauses={entry.pauses} />
        </div>
      </div>
    </div>
  )
}

// ----- Componente principal -----

export function TimesheetList({
  groupedEntries,
  emptyLabel = 'Nenhum registro de tempo.',
  emptyHint = 'Inicie uma sessão no Dashboard.',
  onEntryUpdated,
}: TimesheetListProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const sortedDays = Object.keys(groupedEntries).sort(
    (a, b) => b.localeCompare(a), // mais recente primeiro
  )

  const selectedEntries = selectedDay ? groupedEntries[selectedDay] ?? [] : []

  if (sortedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-12">
        <Clock className="mb-2 h-7 w-7 text-slate-700" />
        <p className="text-sm text-slate-500">{emptyLabel}</p>
        <p className="mt-0.5 text-xs text-slate-600">{emptyHint}</p>
      </div>
    )
  }

  return (
    <>
      {/* Lista de dias */}
      <div className="space-y-2">
        {sortedDays.map((day) => {
          const entries = groupedEntries[day]
          const totalSeconds = sumDuration(entries)

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-5 py-4 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/30"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 shrink-0 text-slate-600" />
                <div>
                  <p className="text-sm font-medium capitalize text-slate-200">
                    {formatDayLabel(day)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {entries.length} {entries.length === 1 ? 'sessão' : 'sessões'}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-slate-300">
                {formatTime(totalSeconds)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Modal de detalhes do dia */}
      <Modal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDayLabel(selectedDay) : ''}
      >
        <div className="space-y-2">
          {/* Resumo */}
          <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-800/40 px-4 py-2.5">
            <span className="text-xs text-slate-400">
              {selectedEntries.length}{' '}
              {selectedEntries.length === 1 ? 'sessão' : 'sessões'}
            </span>
            <span className="font-mono text-sm font-semibold text-slate-200">
              {formatTime(sumDuration(selectedEntries))}
            </span>
          </div>

          {/* Sessões */}
          {selectedEntries.map((entry) => (
            <SessionRow key={entry.id} entry={entry} onEntryUpdated={onEntryUpdated} />
          ))}
        </div>
      </Modal>
    </>
  )
}
