import { Clock, Minus } from 'lucide-react'
import type { TimeEntryWithDetails } from '@/hooks/useWork'
import { formatTime } from '@/lib/formatTime'

interface TimesheetListProps {
  entries: TimeEntryWithDetails[]
}

export function TimesheetList({ entries }: TimesheetListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-12">
        <Clock className="mb-2 h-7 w-7 text-slate-700" />
        <p className="text-sm text-slate-500">Nenhum registro de tempo.</p>
        <p className="mt-0.5 text-xs text-slate-600">
          Inicie uma sessão de trabalho no Dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            <th className="whitespace-nowrap px-4 py-2.5">Data</th>
            <th className="whitespace-nowrap px-4 py-2.5">Projeto</th>
            <th className="whitespace-nowrap px-4 py-2.5">Tarefa</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-right">
              Duração
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="transition-colors hover:bg-slate-800/30"
            >
              {/* Data */}
              <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                {new Date(entry.start_time).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })}
              </td>

              {/* Projeto (Categoria) */}
              <td className="whitespace-nowrap px-4 py-3">
                {entry.categories ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: entry.categories.color_hex,
                      }}
                    />
                    <span className="text-slate-300">
                      {entry.categories.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>

              {/* Tarefa */}
              <td className="max-w-[200px] truncate px-4 py-3 text-slate-400">
                {entry.tasks ? (
                  entry.tasks.title
                ) : (
                  <Minus className="h-3.5 w-3.5 text-slate-700" />
                )}
              </td>

              {/* Duração */}
              <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-slate-300">
                {entry.total_duration != null
                  ? formatTime(entry.total_duration)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
