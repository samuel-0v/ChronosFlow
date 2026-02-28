import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { FinanceCategoryType, FinanceCategoryInsert } from '@/types/finance'

// ===================== Props =====================

interface CategoryFormProps {
  onSubmit: (data: Omit<FinanceCategoryInsert, 'user_id'>) => Promise<boolean>
  onCancel?: () => void
}

// ===================== Paleta de cores =====================

const COLOR_PALETTE = [
  '#94a3b8', // slate
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#a3e635', // lime
  '#34d399', // emerald
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#818cf8', // indigo
  '#a78bfa', // violet
  '#e879f9', // fuchsia
  '#fb7185', // rose
]

// ===================== Componente =====================

export function FinanceCategoryForm({ onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<FinanceCategoryType>('EXPENSE')
  const [colorHex, setColorHex] = useState(COLOR_PALETTE[0])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome é obrigatório.')
      return
    }

    setIsSubmitting(true)

    const success = await onSubmit({
      name: name.trim(),
      type,
      color_hex: colorHex,
    })

    setIsSubmitting(false)

    if (!success) {
      setError('Erro ao criar categoria. Tente novamente.')
      return
    }

    // Reset — o pai fecha o modal
    setName('')
    setType('EXPENSE')
    setColorHex(COLOR_PALETTE[0])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="fcat-name">Nome *</Label>
        <Input
          id="fcat-name"
          placeholder="Ex: Alimentação, Salário, Transporte..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label htmlFor="fcat-type">Tipo</Label>
        <Select
          id="fcat-type"
          value={type}
          onChange={(e) => setType(e.target.value as FinanceCategoryType)}
        >
          <option value="EXPENSE">Despesa</option>
          <option value="INCOME">Receita</option>
        </Select>
      </div>

      {/* Cor */}
      <div className="space-y-1.5">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setColorHex(color)}
              className={`h-8 w-8 rounded-lg border-2 transition-all ${
                colorHex === color
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent hover:border-slate-600'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
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
