import { Target, Briefcase, BookOpen, Loader2 } from 'lucide-react'
import { formatDuration } from '@/lib/formatTime'

interface WeeklyGoalsCardProps {
  workGoalHours: number
  studyGoalHours: number
  weekWorkSeconds: number
  weekStudySeconds: number
  workPercent: number
  studyPercent: number
  isLoading: boolean
}

function ProgressBar({
  label,
  icon: Icon,
  currentSeconds,
  goalHours,
  percent,
  barColor,
  textColor,
  bgColor,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  currentSeconds: number
  goalHours: number
  percent: number
  barColor: string
  textColor: string
  bgColor: string
}) {
  const clampedPercent = Math.min(percent, 100)
  const currentFormatted = formatDuration(currentSeconds)
  const goalFormatted = `${goalHours}h`

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${bgColor}`}>
            <Icon className={`h-3.5 w-3.5 ${textColor}`} />
          </div>
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <span className={`text-xs font-bold ${textColor}`}>{percent}%</span>
      </div>

      {/* Barra */}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {/* Valores */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {currentFormatted} / {goalFormatted}
        </span>
        {percent >= 100 && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            Meta atingida!
          </span>
        )}
      </div>
    </div>
  )
}

export function WeeklyGoalsCard({
  workGoalHours,
  studyGoalHours,
  weekWorkSeconds,
  weekStudySeconds,
  workPercent,
  studyPercent,
  isLoading,
}: WeeklyGoalsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2 text-slate-400">
        <Target className="h-4 w-4" />
        <span className="text-xs font-semibold tracking-widest uppercase">
          Metas da Semana
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : workGoalHours === 0 && studyGoalHours === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-500">
            Defina suas metas semanais em{' '}
            <span className="font-medium text-slate-400">Configurações</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {workGoalHours > 0 && (
            <ProgressBar
              label="Trabalho"
              icon={Briefcase}
              currentSeconds={weekWorkSeconds}
              goalHours={workGoalHours}
              percent={workPercent}
              barColor="bg-blue-500"
              textColor="text-blue-400"
              bgColor="bg-blue-500/15"
            />
          )}
          {studyGoalHours > 0 && (
            <ProgressBar
              label="Estudo"
              icon={BookOpen}
              currentSeconds={weekStudySeconds}
              goalHours={studyGoalHours}
              percent={studyPercent}
              barColor="bg-emerald-500"
              textColor="text-emerald-400"
              bgColor="bg-emerald-500/15"
            />
          )}
        </div>
      )}
    </div>
  )
}
