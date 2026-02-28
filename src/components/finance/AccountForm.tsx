import { type FormEvent, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { AccountType, FinanceAccountInsert } from '@/types/finance'

// ===================== Props =====================

interface AccountFormProps {
  onSubmit: (data: Omit<FinanceAccountInsert, 'user_id'>) => Promise<boolean>
  onCancel?: () => void
}

// ===================== Componente =====================

export function AccountForm({ onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('CHECKING')
  const [balance, setBalance] = useState('')
  const [closingDay, setClosingDay] = useState('')
  const [dueDay, setDueDay] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCredit = type === 'CREDIT'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('O nome é obrigatório.')
      return
    }

    if (isCredit) {
      const cd = Number(closingDay)
      const dd = Number(dueDay)
      if (!cd || cd < 1 || cd > 31) {
        setError('Dia de fechamento deve ser entre 1 e 31.')
        return
      }
      if (!dd || dd < 1 || dd > 31) {
        setError('Dia de vencimento deve ser entre 1 e 31.')
        return
      }
    }

    setIsSubmitting(true)

    const success = await onSubmit({
      name: name.trim(),
      type,
      balance: isCredit ? 0 : Number(balance) || 0,
      closing_day: isCredit ? Number(closingDay) : null,
      due_day: isCredit ? Number(dueDay) : null,
    })

    setIsSubmitting(false)

    if (!success) {
      setError('Erro ao criar conta. Tente novamente.')
      return
    }

    // Reset — o pai fecha o modal
    setName('')
    setType('CHECKING')
    setBalance('')
    setClosingDay('')
    setDueDay('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="acc-name">Nome *</Label>
        <Input
          id="acc-name"
          placeholder="Ex: Nubank, Itaú, Carteira..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label htmlFor="acc-type">Tipo de Conta</Label>
        <Select
          id="acc-type"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
        >
          <option value="CHECKING">Conta Corrente (Pix / Débito)</option>
          <option value="CREDIT">Cartão de Crédito</option>
          <option value="CASH">Dinheiro Físico</option>
        </Select>
      </div>

      {/* Saldo inicial (oculto para crédito) */}
      {!isCredit && (
        <div className="space-y-1.5">
          <Label htmlFor="acc-balance">Saldo Inicial (R$)</Label>
          <Input
            id="acc-balance"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>
      )}

      {/* Campos adicionais de cartão de crédito */}
      {isCredit && (
        <div className="space-y-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <p className="flex items-center gap-2 text-xs font-medium text-violet-400">
            <CreditCard className="h-3.5 w-3.5" />
            Configuração do Cartão
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Dia de fechamento */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-closing">Fechamento</Label>
              <Input
                id="acc-closing"
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 15"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
              />
              <p className="text-[10px] text-slate-500">Dia (1–31)</p>
            </div>

            {/* Dia de vencimento */}
            <div className="space-y-1.5">
              <Label htmlFor="acc-due">Vencimento</Label>
              <Input
                id="acc-due"
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 25"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
              <p className="text-[10px] text-slate-500">Dia (1–31)</p>
            </div>
          </div>
        </div>
      )}

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
          Criar Conta
        </Button>
      </div>
    </form>
  )
}
