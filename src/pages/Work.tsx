import { Briefcase } from 'lucide-react'

export function Work() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Trabalho</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie seus projetos e tarefas profissionais.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 py-20">
        <Briefcase className="mb-3 h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-500">Em breve — Quadro Ágil de Trabalho</p>
      </div>
    </div>
  )
}
