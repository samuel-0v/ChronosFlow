import { useMemo, useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Lock,
  Inbox,
  AlertTriangle,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { formatCurrency } from '@/lib/formatCurrency'
import type { BillWithAccount, FinanceAccount, FinanceBillUpdate, BillStatus } from '@/types/finance'

// ===================== Props =====================

interface BillManagerProps {
  bills: BillWithAccount[]
  accounts: FinanceAccount[]
  isLoading: boolean
  onPayBill: (billId: string, sourceAccountId: string) => Promise<{ ok: boolean; error?: string }>
  onUpdateBill?: (id: string, data: FinanceBillUpdate) => Promise<boolean>
  onDeleteBill?: (id: string) => Promise<boolean>
  onRevertPayment?: (billId: string) => Promise<{ ok: boolean; error?: string }>
}

// ===================== Helpers =====================

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

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
  onUpdate,
  onDelete,
  onRevert,
}: {
  bill: BillWithAccount
  payableAccounts: FinanceAccount[]
  onPay: (billId: string, sourceAccountId: string) => Promise<{ ok: boolean; error?: string }>
  onUpdate?: (id: string, data: FinanceBillUpdate) => Promise<boolean>
  onDelete?: (id: string) => Promise<boolean>
  onRevert?: (billId: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [showPayForm, setShowPayForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit form state
  const [editDueDate, setEditDueDate] = useState(bill.due_date ?? '')

  const status = statusConfig(bill.status)
  const canPay = bill.status === 'OPEN' || bill.status === 'CLOSED'
  const canEdit = bill.status !== 'PAID'
  const canDelete = bill.status === 'OPEN'
  const canRevert = bill.status === 'PAID'
  const cardName = bill.finance_accounts?.name ?? 'Cartão'
  const monthYear = `${MONTH_NAMES[bill.month]} ${bill.year}`

  const closeAll = () => {
    setShowPayForm(false)
    setShowEditForm(false)
    setShowDeleteConfirm(false)
    setError(null)
  }

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

    closeAll()
    setSourceAccountId('')
  }

  const handleUpdate = async () => {
    if (!onUpdate) return
    setError(null)
    setIsUpdating(true)

    const ok = await onUpdate(bill.id, { due_date: editDueDate })
    setIsUpdating(false)

    if (!ok) {
      setError('Erro ao atualizar fatura.')
      return
    }
    closeAll()
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setError(null)
    setIsDeleting(true)

    const ok = await onDelete(bill.id)
    setIsDeleting(false)

    if (!ok) {
      setError('Erro ao excluir fatura.')
      return
    }
    closeAll()
  }

  const handleRevert = async () => {
    if (!onRevert) return
    setError(null)
    setIsReverting(true)

    const result = await onRevert(bill.id)
    setIsReverting(false)

    if (!result.ok) {
      setError(result.error ?? 'Erro ao desfazer pagamento.')
      return
    }
    closeAll()
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
              closeAll()
              setShowPayForm(true)
            }}
          >
            Pagar
          </Button>
        )}

        {/* Botão desfazer pagamento */}
        {canRevert && onRevert && (
          <Button
            variant="ghost"
            size="sm"
            isLoading={isReverting}
            onClick={handleRevert}
            className="text-amber-400 hover:text-amber-300"
          >
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            Desfazer
          </Button>
        )}

        {/* Botão editar */}
        {canEdit && onUpdate && (
          <button
            type="button"
            onClick={() => {
              closeAll()
              setEditDueDate(bill.due_date ?? '')
              setShowEditForm(true)
            }}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Botão excluir */}
        {canDelete && onDelete && (
          <button
            type="button"
            onClick={() => {
              closeAll()
              setShowDeleteConfirm(true)
            }}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
                  onClick={closeAll}
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

      {/* Formulário de edição inline */}
      {showEditForm && (
        <div className="mx-4 mb-4 space-y-3 rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <p className="text-xs font-medium text-slate-300">
            Editar vencimento da fatura
          </p>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-due-${bill.id}`}>Data de vencimento</Label>
            <Input
              id={`edit-due-${bill.id}`}
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeAll}>
              Cancelar
            </Button>
            <Button size="sm" isLoading={isUpdating} onClick={handleUpdate}>
              Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="mx-4 mb-4 space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs font-medium text-slate-300">
            Tem certeza que deseja excluir esta fatura?
          </p>
          <p className="text-[11px] text-slate-500">
            As transações vinculadas não serão excluídas, apenas desvinculadas.
          </p>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeAll}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDelete}>
              Excluir Fatura
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== Componente principal =====================

export function BillManager({
  bills,
  accounts,
  isLoading,
  onPayBill,
  onUpdateBill,
  onDeleteBill,
  onRevertPayment,
}: BillManagerProps) {
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
          onUpdate={onUpdateBill}
          onDelete={onDeleteBill}
          onRevert={onRevertPayment}
        />
      ))}

      <p className="px-4 py-3 text-center text-[11px] text-slate-600">
        {sortedBills.length} {sortedBills.length === 1 ? 'fatura' : 'faturas'}
      </p>
    </div>
  )
}
