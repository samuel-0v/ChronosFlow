import { CalendarDays, Clock, Loader2 } from 'lucide-react'
import { formatDuration } from '@/lib/formatTime'
import type { CategoryBreakdown } from '@/hooks/useStats'

interface TodaySummaryCardProps {
  todayTotalSeconds: number
  todayByCategory: CategoryBreakdown[]
  isLoading: boolean
}

export function TodaySummaryCard({
  todayTotalSeconds,
  todayByCategory,
  isLoading,
}: TodaySummaryCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2 text-slate-400">
        <CalendarDays className="h-4 w-4" />
        <span className="text-xs font-semibold tracking-widest uppercase">
          Resumo de Hoje
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : todayTotalSeconds === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Clock className="mb-2 h-7 w-7 text-slate-700" />
          <p className="text-sm text-slate-500">Nenhum tempo registrado hoje.</p>
          <p className="mt-0.5 text-xs text-slate-600">Inicie o timer para começar!</p>
        </div>
      ) : (
        <>
          {/* Total do dia */}
          <div className="mb-5 rounded-xl bg-slate-800/50 px-4 py-3 text-center">
            <p className="text-3xl font-bold text-slate-100">
              {formatDuration(todayTotalSeconds)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Total registrado</p>
          </div>

          {/* Breakdown por categoria */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
              Por categoria
            </p>

            {todayByCategory.map((cat) => {
              const pct =
                todayTotalSeconds > 0
                  ? Math.round((cat.totalSeconds / todayTotalSeconds) * 100)
                  : 0

              return (
                <div key={cat.categoryId ?? '__none__'} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <span className="text-sm text-slate-300">{cat.categoryName}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {formatDuration(cat.totalSeconds)}
                    </span>
                  </div>

                  {/* Mini barra */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cat.colorHex,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
