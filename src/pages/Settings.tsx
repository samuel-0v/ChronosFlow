import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Configurações</h1>
        <p className="mt-1 text-sm text-slate-500">Ajuste suas metas e preferências.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 py-20">
        <Settings className="mb-3 h-10 w-10 text-slate-600" />
        <p className="text-sm text-slate-500">Em breve — Configurações do perfil e metas</p>
      </div>
    </div>
  )
}
