// ==========================================
// ChronosFlow - Profile Page
// ==========================================

import { type FormEvent, useEffect, useState } from 'react'
import { User, Target, Save, Loader2 } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

export function Profile() {
  const { profile, isLoading, isSaving, error, updateProfile } = useProfile()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [workGoalHours, setWorkGoalHours] = useState('')
  const [studyGoalHours, setStudyGoalHours] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Popular formulário quando o perfil carrega
  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
    setWorkGoalHours(String(profile.work_goal_hours ?? 0))
    setStudyGoalHours(String(profile.study_goal_hours ?? 0))
  }, [profile])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)

    const success = await updateProfile({
      full_name: fullName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      work_goal_hours: Number(workGoalHours) || 0,
      study_goal_hours: Number(studyGoalHours) || 0,
    })

    if (success) {
      setSuccessMsg('Perfil atualizado com sucesso!')
      setTimeout(() => setSuccessMsg(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    )
  }

  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Perfil</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gerencie suas informações pessoais e metas semanais.
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex items-center gap-5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-700"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600/20 text-lg font-bold text-primary-400 ring-2 ring-slate-700">
            {initials}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-200">
            {fullName || 'Sem nome'}
          </p>
          <p className="text-xs text-slate-500">
            Atualize sua foto via URL abaixo.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados pessoais */}
        <fieldset className="space-y-4 rounded-xl border border-slate-800 p-5">
          <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-300">
            <User className="h-4 w-4" />
            Dados pessoais
          </legend>

          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nome completo</Label>
            <Input
              id="profile-name"
              placeholder="Ex: João Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-avatar">URL do avatar</Label>
            <Input
              id="profile-avatar"
              type="url"
              placeholder="https://exemplo.com/foto.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Metas semanais */}
        <fieldset className="space-y-4 rounded-xl border border-slate-800 p-5">
          <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-300">
            <Target className="h-4 w-4" />
            Metas semanais
          </legend>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-work-goal">Trabalho (horas)</Label>
              <Input
                id="profile-work-goal"
                type="number"
                min={0}
                max={168}
                step={0.5}
                value={workGoalHours}
                onChange={(e) => setWorkGoalHours(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-study-goal">Estudo (horas)</Label>
              <Input
                id="profile-study-goal"
                type="number"
                min={0}
                max={168}
                step={0.5}
                value={studyGoalHours}
                onChange={(e) => setStudyGoalHours(e.target.value)}
              />
            </div>
          </div>
        </fieldset>

        {/* Mensagens */}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            {successMsg}
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </form>
    </div>
  )
}
