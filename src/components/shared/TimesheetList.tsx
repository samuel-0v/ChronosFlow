import { useState } from 'react'
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  PauseCircle,
} from 'lucide-react'
import { Modal } from '@/components/ui'
import { formatTime } from '@/lib/formatTime'
import type { GroupedEntries, TimeEntryWithDetails, Pause } from '@/types'

// ----- Props -----

interface TimesheetListProps {
  groupedEntries: GroupedEntries
  emptyLabel?: string
  emptyHint?: string
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

function SessionRow({ entry }: { entry: TimeEntryWithDetails }) {
  const [expanded, setExpanded] = useState(false)
  const hasPauses = entry.pauses.length > 0

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40">
      {/* Linha principal clicável */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
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
      </button>

      {/* Pausas (acordeão com animação) */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? 'max-h-[500px] opacity-100 pb-3' : 'max-h-0 opacity-0'
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
            <SessionRow key={entry.id} entry={entry} />
          ))}
        </div>
      </Modal>
    </>
  )
}
