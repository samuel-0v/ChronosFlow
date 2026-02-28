import { useMemo, useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Lock,
  Inbox,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type { BillWithAccount, FinanceAccount, BillStatus } from '@/types/finance'

// ===================== Props =====================

interface BillManagerProps {
  bills: BillWithAccount[]
  accounts: FinanceAccount[]
  isLoading: boolean
  onPayBill: (billId: string, sourceAccountId: string) => Promise<{ ok: boolean; error?: string }>
}

// ===================== Helpers =====================

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusConfig(status: BillStatus) {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Aberta',
        icon: <Clock className="h-3.5 w-3.5" />,
        className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
      }
    case 'CLOSED':
      return {
        label: 'Fechada',
        icon: <Lock className="h-3.5 w-3.5" />,
        className: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
      }
    case 'PAID':
      return {
        label: 'Paga',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
      }
  }
}

// ===================== Skeleton =====================

function SkeletonBillRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-4 py-4">
      <div className="h-9 w-9 rounded-lg bg-slate-800" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-36 rounded bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-800/60" />
      </div>
      <div className="h-5 w-20 rounded bg-slate-800" />
    </div>
  )
}

// ===================== Bill Row =====================

function BillRow({
  bill,
  payableAccounts,
  onPay,
}: {
  bill: BillWithAccount
  payableAccounts: FinanceAccount[]
  onPay: (billId: string, sourceAccountId: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [showPayForm, setShowPayForm] = useState(false)
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = statusConfig(bill.status)
  const canPay = bill.status === 'OPEN' || bill.status === 'CLOSED'
  const cardName = bill.finance_accounts?.name ?? 'Cartão'
  const monthYear = `${MONTH_NAMES[bill.month]} ${bill.year}`

  const handlePay = async () => {
    if (!sourceAccountId) {
      setError('Selecione a conta para pagamento.')
      return
    }
    setError(null)
    setIsPaying(true)

    const result = await onPay(bill.id, sourceAccountId)
    setIsPaying(false)

    if (!result.ok) {
      setError(result.error ?? 'Erro ao pagar fatura. Tente novamente.')
      return
    }

    setShowPayForm(false)
    setSourceAccountId('')
  }

  return (
    <div className="border-b border-slate-800/50 last:border-b-0">
      {/* Linha principal */}
      <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
        {/* Ícone */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
          <CreditCard className="h-4 w-4" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">{cardName}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{monthYear}</p>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${status.className}`}
        >
          {status.icon}
          {status.label}
        </span>

        {/* Valor */}
        <span className="shrink-0 text-sm font-bold tabular-nums text-violet-400">
          {formatCurrency(bill.total_amount)}
        </span>

        {/* Botão pagar */}
        {canPay && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowPayForm((p) => !p)
              setError(null)
            }}
          >
            Pagar
          </Button>
        )}
      </div>

      {/* Formulário de pagamento inline */}
      {showPayForm && (
        <div className="mx-4 mb-4 space-y-3 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <p className="text-xs font-medium text-slate-300">
            Pagar usando qual conta?
          </p>

          {payableAccounts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Nenhuma conta corrente ou dinheiro cadastrada.
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor={`pay-source-${bill.id}`}>Conta de origem</Label>
                <Select
                  id={`pay-source-${bill.id}`}
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione a conta
                  </option>
                  {payableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </Select>
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPayForm(false)
                    setError(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  isLoading={isPaying}
                  disabled={!sourceAccountId}
                  onClick={handlePay}
                >
                  Confirmar Pagamento
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ===================== Componente principal =====================

export function BillManager({ bills, accounts, isLoading, onPayBill }: BillManagerProps) {
  // Apenas contas CHECKING ou CASH podem ser usadas para pagar faturas
  const payableAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'CHECKING' || a.type === 'CASH'),
    [accounts],
  )

  // Ordena: pendentes primeiro, depois pagas
  const sortedBills = useMemo(() => {
    const order: Record<BillStatus, number> = { OPEN: 0, CLOSED: 1, PAID: 2 }
    return [...bills].sort((a, b) => {
      const statusDiff = order[a.status] - order[b.status]
      if (statusDiff !== 0) return statusDiff
      // Mesmo status → mais recente primeiro
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
  }, [bills])

  if (isLoading) {
    return (
      <div className="divide-y divide-slate-800/50">
        <SkeletonBillRow />
        <SkeletonBillRow />
        <SkeletonBillRow />
      </div>
    )
  }

  if (sortedBills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Inbox className="mb-2 h-8 w-8 text-slate-700" />
        <p className="text-sm font-medium text-slate-500">Nenhuma fatura encontrada.</p>
        <p className="mt-0.5 text-xs text-slate-600">
          Faturas são criadas automaticamente ao registrar gastos no cartão de crédito.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-800/50">
      {sortedBills.map((bill) => (
        <BillRow
          key={bill.id}
          bill={bill}
          payableAccounts={payableAccounts}
          onPay={onPayBill}
        />
      ))}

      <p className="px-4 py-3 text-center text-[11px] text-slate-600">
        {sortedBills.length} {sortedBills.length === 1 ? 'fatura' : 'faturas'}
      </p>
    </div>
  )
}
