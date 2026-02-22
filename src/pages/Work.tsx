import { useState } from 'react'
import { Briefcase, LayoutGrid, Clock, Loader2 } from 'lucide-react'
import { useWork } from '@/hooks/useWork'
import { WorkKanban } from '@/components/work'
import { TimesheetList } from '@/components/shared'

type WorkTab = 'kanban' | 'timesheet'

export function Work() {
  const {
    tasks,
    groupedEntries,
    isLoadingTasks,
    isLoadingEntries,
    isUpdating,
    updateTaskStatus,
  } = useWork()

  const [activeTab, setActiveTab] = useState<WorkTab>('kanban')

  const tabs: { key: WorkTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'kanban',
      label: 'Quadro de Tarefas',
      icon: <LayoutGrid className="h-4 w-4" />,
    },
    {
      key: 'timesheet',
      label: 'Relatório de Horas',
      icon: <Clock className="h-4 w-4" />,
    },
  ]

  const isLoading =
    (activeTab === 'kanban' && isLoadingTasks) ||
    (activeTab === 'timesheet' && isLoadingEntries)

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Trabalho</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie seus projetos e tarefas profissionais.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600/15 text-primary-400'
                : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : activeTab === 'kanban' ? (
          tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="mb-2 h-8 w-8 text-slate-700" />
              <p className="text-sm text-slate-500">
                Nenhuma tarefa de trabalho encontrada.
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Crie tarefas vinculadas a categorias do tipo "Trabalho" na
                página de Dashboard.
              </p>
            </div>
          ) : (
            <WorkKanban
              tasks={tasks}
              isUpdating={isUpdating}
              onStatusChange={updateTaskStatus}
            />
          )
        ) : (
          <TimesheetList
            groupedEntries={groupedEntries}
            emptyLabel="Nenhum registro de trabalho."
            emptyHint="Inicie uma sessão de trabalho no Dashboard."
          />
        )}
      </div>
    </div>
  )
}

