// ==========================================
// ChronosFlow - Finance Page (Dashboard Financeiro)
// ==========================================

import { useMemo, useState } from 'react'
import {
  Plus,
  Inbox,
  Wallet,
  Landmark,
  Banknote,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Receipt,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import { useFinance } from '@/hooks/useFinance'
import { Modal, Button } from '@/components/ui'
import { TransactionForm, AccountForm, FinanceCategoryForm, SafeDeleteModal } from '@/components/finance'
import type { TransactionWithDetails, NewTransactionPayload, FinanceAccount } from '@/types/finance'

// ===================== Helpers =====================

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/** Ícone por tipo de conta */
function AccountIcon({ type }: { type: string }) {
  switch (type) {
    case 'CREDIT':
      return <CreditCard className="h-5 w-5" />
    case 'CASH':
      return <Banknote className="h-5 w-5" />
    default:
      return <Landmark className="h-5 w-5" />
  }
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CHECKING: 'Conta Corrente',
  CREDIT: 'Cartão de Crédito',
  CASH: 'Dinheiro',
}

// ===================== Skeleton components =====================

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-800" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-24 rounded bg-slate-800" />
          <div className="h-3 w-16 rounded bg-slate-800/60" />
        </div>
        <div className="h-5 w-20 rounded bg-slate-800" />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 px-4 py-3.5">
      <div className="h-8 w-8 rounded-lg bg-slate-800" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-40 rounded bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-800/60" />
      </div>
      <div className="h-4 w-20 rounded bg-slate-800" />
    </div>
  )
}

// ===================== Summary cards =====================

function SummaryCard({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string
  value: number
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-slate-100 truncate">
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  )
}

// ===================== Account Card =====================

function AccountCard({
  account,
  currentBillTotal,
  onUpdateBalance,
  onDelete,
}: {
  account: FinanceAccount
  currentBillTotal: number | null
  onUpdateBalance: (id: string, balance: number) => Promise<boolean>
  onDelete: (account: FinanceAccount) => void
}) {
  const isCredit = account.type === 'CREDIT'
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = () => {
    setEditValue(String(account.balance))
    setIsEditing(true)
  }

  const cancelEdit = () => { setIsEditing(false) }

  const saveBalance = async () => {
    const parsed = Number(editValue)
    if (isNaN(parsed)) return
    setIsSaving(true)
    const ok = await onUpdateBalance(account.id, parsed)
    setIsSaving(false)
    if (ok) setIsEditing(false)
  }

  return (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 sm:p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isCredit
            ? 'bg-violet-500/15 text-violet-400'
            : account.type === 'CASH'
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-sky-500/15 text-sky-400'
        }`}
      >
        <AccountIcon type={account.type} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-100">{account.name}</p>
        <p className="text-[11px] text-slate-500">{ACCOUNT_TYPE_LABELS[account.type] ?? account.type}</p>
      </div>

      <div className="text-right shrink-0">
        {isCredit ? (
          <>
            <p className="text-sm font-bold text-violet-400">
              {currentBillTotal !== null ? formatCurrency(currentBillTotal) : '—'}
            </p>
            <p className="text-[10px] text-slate-500">Fatura atual</p>
          </>
        ) : isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveBalance()
                if (e.key === 'Escape') cancelEdit()
              }}
              autoFocus
              className="w-28 rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-right text-sm text-slate-100 focus:border-primary-500 focus:outline-none"
            />
            <button
              onClick={saveBalance}
              disabled={isSaving}
              className="rounded-md p-1 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p
            className={`text-sm font-bold ${
              account.balance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(account.balance)}
          </p>
        )}
      </div>

      {/* Action buttons — visíveis no hover */}
      {!isEditing && (
        <div className="absolute -right-1 -top-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!isCredit && (
            <button
              onClick={startEdit}
              title="Editar saldo"
              className="rounded-lg bg-slate-800 p-1.5 text-slate-400 shadow-sm ring-1 ring-slate-700 hover:text-primary-400 hover:ring-primary-600"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => onDelete(account)}
            title="Excluir conta"
            className="rounded-lg bg-slate-800 p-1.5 text-slate-400 shadow-sm ring-1 ring-slate-700 hover:text-red-400 hover:ring-red-600"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// ===================== Transaction Row =====================

function TransactionRow({ tx, onDelete }: { tx: TransactionWithDetails; onDelete: (tx: TransactionWithDetails) => void }) {
  const isIncome = tx.type === 'INCOME'
  const isTransfer = tx.type === 'TRANSFER'

  return (
    <div className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-800/40 sm:gap-4">
      {/* Ícone */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isTransfer
            ? 'bg-sky-500/10 text-sky-400'
            : isIncome
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
        }`}
      >
        {isTransfer ? (
          <ArrowLeftRight className="h-4 w-4" />
        ) : isIncome ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
      </div>

      {/* Descrição + categoria */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{tx.description}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
          <span>{formatDate(tx.date)}</span>
          {tx.finance_categories && (
            <>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tx.finance_categories.color_hex }}
                />
                {tx.finance_categories.name}
              </span>
            </>
          )}
          {tx.finance_accounts && (
            <>
              <span className="hidden text-slate-700 sm:inline">·</span>
              <span className="hidden sm:inline">{tx.finance_accounts.name}</span>
            </>
          )}
          {tx.is_installment && tx.installment_number && tx.total_installments && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-slate-400">
                {tx.installment_number}/{tx.total_installments}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Valor */}
      <span
        className={`shrink-0 text-sm font-bold tabular-nums ${
          isTransfer
            ? 'text-sky-400'
            : isIncome
              ? 'text-emerald-400'
              : 'text-red-400'
        }`}
      >
        {isIncome ? '+' : isTransfer ? '' : '−'} {formatCurrency(tx.amount)}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(tx)}
        title="Excluir transação"
        className="shrink-0 rounded-lg p-1.5 text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ===================== Filtros =====================

type TxFilterKey = 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'

const TX_FILTER_OPTIONS: { key: TxFilterKey; label: string }[] = [
  { key: 'ALL', label: 'Todas' },
  { key: 'INCOME', label: 'Receitas' },
  { key: 'EXPENSE', label: 'Despesas' },
  { key: 'TRANSFER', label: 'Transferências' },
]

// ===================== Page =====================

export function Finance() {
  const { accounts, categories, bills, transactions } = useFinance()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [txFilter, setTxFilter] = useState<TxFilterKey>('ALL')

  // SafeDelete state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'account' | 'transaction'
    id: string
    name: string
    warning?: string
  } | null>(null)

  const handleDeleteAccount = (acc: FinanceAccount) => {
    setDeleteTarget({
      type: 'account',
      id: acc.id,
      name: acc.name,
      warning: 'Todas as transações vinculadas a esta conta também serão excluídas.',
    })
  }

  const handleDeleteTransaction = (tx: TransactionWithDetails) => {
    setDeleteTarget({
      type: 'transaction',
      id: tx.id,
      name: tx.description,
      warning: tx.is_installment
        ? 'Esta é uma transação parcelada. Parcelas filhas também serão excluídas.'
        : undefined,
    })
  }

  const confirmDelete = async (): Promise<boolean> => {
    if (!deleteTarget) return false
    if (deleteTarget.type === 'account') return accounts.deleteAccount(deleteTarget.id)
    return transactions.deleteTransaction(deleteTarget.id)
  }

  // --- Dados derivados ---

  // Saldo consolidado (todas as contas exceto crédito)
  const totalBalance = useMemo(() => {
    return accounts.accounts
      .filter((a) => a.type !== 'CREDIT')
      .reduce((sum, a) => sum + a.balance, 0)
  }, [accounts.accounts])

  // Total de receitas do mês atual
  const { monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    let income = 0
    let expense = 0

    for (const tx of transactions.transactions) {
      const [y, m] = tx.date.split('-').map(Number)
      if (y !== currentYear || m !== currentMonth) continue
      if (tx.type === 'INCOME') income += tx.amount
      else if (tx.type === 'EXPENSE') expense += tx.amount
    }

    return { monthlyIncome: income, monthlyExpense: expense }
  }, [transactions.transactions])

  // Fatura atual de cada cartão de crédito
  const currentBillByAccount = useMemo(() => {
    const now = new Date()
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    const map: Record<string, number> = {}

    for (const bill of bills.bills) {
      if (bill.month === m && bill.year === y) {
        map[bill.account_id] = bill.total_amount
      }
    }
    return map
  }, [bills.bills])

  // Transações filtradas
  const filteredTx = useMemo(() => {
    if (txFilter === 'ALL') return transactions.transactions
    return transactions.transactions.filter((tx) => tx.type === txFilter)
  }, [transactions.transactions, txFilter])

  const isAnythingLoading = accounts.isLoading || transactions.isLoading

  return (
    <div className="mx-auto max-w-6xl">
      {/* ========== Header ========== */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Finanças</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie receitas, despesas e cartões de crédito.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Categoria
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAccountModalOpen(true)}>
            <Landmark className="mr-1 h-3.5 w-3.5" />
            Nova Conta
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* ========== Summary Cards ========== */}
      {isAnythingLoading ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Saldo Total"
            value={totalBalance}
            icon={<Wallet className="h-5 w-5" />}
            colorClass="bg-primary-600/15 text-primary-400"
          />
          <SummaryCard
            label="Receita do Mês"
            value={monthlyIncome}
            icon={<TrendingUp className="h-5 w-5" />}
            colorClass="bg-emerald-500/15 text-emerald-400"
          />
          <SummaryCard
            label="Despesa do Mês"
            value={monthlyExpense}
            icon={<TrendingDown className="h-5 w-5" />}
            colorClass="bg-red-500/15 text-red-400"
          />
        </div>
      )}

      {/* ========== Contas ========== */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Landmark className="h-4 w-4 text-slate-500" />
          Minhas Contas
        </h2>

        {accounts.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : accounts.accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-12">
            <Landmark className="mb-2 h-7 w-7 text-slate-700" />
            <p className="text-sm font-medium text-slate-500">Nenhuma conta cadastrada.</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Cadastre suas contas e cartões para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                currentBillTotal={currentBillByAccount[acc.id] ?? null}
                onUpdateBalance={accounts.updateAccountBalance}
                onDelete={handleDeleteAccount}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========== Transações ========== */}
      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <Receipt className="h-4 w-4 text-slate-500" />
            Transações Recentes
          </h2>

          {/* Filtros */}
          <div className="flex flex-wrap gap-1.5">
            {TX_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTxFilter(opt.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  txFilter === opt.key
                    ? 'bg-primary-600/15 text-primary-400'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {transactions.isLoading ? (
          <div className="divide-y divide-slate-800/50 rounded-2xl border border-slate-800 bg-slate-900">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16">
            <Inbox className="mb-2 h-8 w-8 text-slate-700" />
            <p className="text-sm font-medium text-slate-500">
              {txFilter === 'ALL'
                ? 'Nenhuma movimentação registrada.'
                : 'Nenhuma movimentação neste filtro.'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {txFilter === 'ALL'
                ? 'Clique em "Nova Movimentação" para começar.'
                : 'Tente outro filtro ou registre uma movimentação.'}
            </p>
            {txFilter === 'ALL' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Registrar primeira movimentação
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50 rounded-2xl border border-slate-800 bg-slate-900">
            {filteredTx.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onDelete={handleDeleteTransaction} />
            ))}
          </div>
        )}

        {/* Contagem */}
        {!transactions.isLoading && filteredTx.length > 0 && (
          <p className="mt-3 text-center text-xs text-slate-600">
            {filteredTx.length}{' '}
            {filteredTx.length === 1 ? 'movimentação' : 'movimentações'}
            {txFilter !== 'ALL' &&
              ` · filtro: ${TX_FILTER_OPTIONS.find((o) => o.key === txFilter)?.label}`}
          </p>
        )}
      </section>

      {/* ========== Modal Nova Movimentação ========== */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nova Movimentação"
      >
        <TransactionForm
          accounts={accounts.accounts}
          categories={categories.categories}
          isSubmitting={transactions.isSubmitting}
          onSubmit={async (payload: NewTransactionPayload) => {
            const ok = await transactions.createTransaction(payload)
            if (ok) setIsCreateOpen(false)
            return ok
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* ========== Modal Nova Conta ========== */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        title="Nova Conta"
      >
        <AccountForm
          onSubmit={async (data) => {
            const ok = await accounts.createAccount(data)
            if (ok) setIsAccountModalOpen(false)
            return ok
          }}
          onSubmitHybrid={async (data) => {
            const ok = await accounts.createHybridAccount(data)
            if (ok) setIsAccountModalOpen(false)
            return ok
          }}
          onCancel={() => setIsAccountModalOpen(false)}
        />
      </Modal>

      {/* ========== Modal Nova Categoria ========== */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nova Categoria Financeira"
      >
        <FinanceCategoryForm
          onSubmit={async (data) => {
            const ok = await categories.createCategory(data)
            if (ok) setIsCategoryModalOpen(false)
            return ok
          }}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>

      {/* ========== SafeDelete Modal ========== */}
      <SafeDeleteModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        resourceName={deleteTarget?.name ?? ''}
        warningText={deleteTarget?.warning}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
