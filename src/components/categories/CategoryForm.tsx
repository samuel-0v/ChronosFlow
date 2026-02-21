import { type FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { CategoryType } from '@/types'

interface CategoryFormProps {
  /** Callback chamado após inserção bem-sucedida */
  onSuccess: () => void
  /** Callback para cancelar / fechar */
  onCancel?: () => void
}

const COLOR_PRESETS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
]

export function CategoryForm({ onSuccess, onCancel }: CategoryFormProps) {
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('WORK')
  const [colorHex, setColorHex] = useState(COLOR_PRESETS[0])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Utilizador não autenticado.')
      return
    }

    if (!name.trim()) {
      setError('O nome é obrigatório.')
      return
    }

    setIsSubmitting(true)

    const { error: insertError } = await supabase
      .from('categories')
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          type,
          color_hex: colorHex,
        },
      ])

    setIsSubmitting(false)

    if (insertError) {
      console.error('[CategoryForm] Erro ao criar categoria:', insertError.message)
      setError('Erro ao criar categoria. Tente novamente.')
      return
    }

    setName('')
    setType('WORK')
    setColorHex(COLOR_PRESETS[0])
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">Nome *</Label>
        <Input
          id="cat-name"
          placeholder="Ex: Projeto Alpha"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label htmlFor="cat-type">Tipo</Label>
        <Select
          id="cat-type"
          value={type}
          onChange={(e) => setType(e.target.value as CategoryType)}
        >
          <option value="WORK">Trabalho</option>
          <option value="STUDY">Estudo</option>
          <option value="PERSONAL">Pessoal</option>
        </Select>
      </div>

      {/* Cor */}
      <div className="space-y-1.5">
        <Label>Cor</Label>
        <div className="flex flex-wrap items-center gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorHex(c)}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                colorHex === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          {/* Custom */}
          <label className="relative h-7 w-7 cursor-pointer">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-600 text-[10px] text-slate-400"
              title="Cor personalizada"
            >
              +
            </span>
          </label>
        </div>
        {/* Preview */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: colorHex }}
          />
          <span className="text-xs text-slate-500">{colorHex}</span>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          Criar Categoria
        </Button>
      </div>
    </form>
  )
}
