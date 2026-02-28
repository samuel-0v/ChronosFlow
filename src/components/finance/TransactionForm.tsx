import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { CreditCard, ArrowLeftRight, Repeat } from 'lucide-react'
import { getLocalISODate } from '@/lib/formatTime'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import type {
  TransactionType,
  PaymentMethod,
  NewTransactionPayload,
  FinanceAccount,
  FinanceCategory,
} from '@/types/finance'

// ===================== Props =====================

interface TransactionFormProps {
  /** Contas do usuário */
  accounts: FinanceAccount[]
  /** Categorias financeiras do usuário */
  categories: FinanceCategory[]
  /** Se o submit está em andamento */
  isSubmitting: boolean
  /** Callback que recebe o payload validado */
  onSubmit: (payload: NewTransactionPayload) => Promise<boolean>
  /** Callback para fechar / cancelar */
  onCancel?: () => void
}

// ===================== Constantes =====================

const TYPE_OPTIONS: { value: TransactionType; label: string; icon: string }[] = [
  { value: 'EXPENSE', label: 'Despesa', icon: '💸' },
  { value: 'INCOME', label: 'Receita', icon: '💰' },
  { value: 'TRANSFER', label: 'Transferência', icon: '🔄' },
]

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: 'Pix' },
  { value: 'DEBIT', label: 'Débito' },
  { value: 'CREDIT', label: 'Crédito' },
  { value: 'CASH', label: 'Dinheiro' },
]

// ===================== Componente =====================

export function TransactionForm({
  accounts,
  categories,
  isSubmitting,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  // ----- Estado do formulário -----
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX')
  const [accountId, setAccountId] = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(getLocalISODate())
  const [totalInstallments, setTotalInstallments] = useState('1')

  const [error, setError] = useState<string | null>(null)

  // ----- Derivados -----
  const isTransfer = type === 'TRANSFER'
  const isCredit = paymentMethod === 'CREDIT'
  const showInstallments = isCredit && type === 'EXPENSE'

  // Filtra contas por tipo de pagamento selecionado
  const availableAccounts = useMemo(() => {
    if (isTransfer) return accounts // Transferência: todas as contas
    if (isCredit) return accounts.filter((a) => a.type === 'CREDIT')
    // PIX/DEBIT: contas correntes e dinheiro
    return accounts.filter((a) => a.type === 'CHECKING' || a.type === 'CASH')
  }, [accounts, isCredit, isTransfer])

  // Contas para destino de transferência (exclui a conta origem)
  const destinationAccounts = useMemo(() => {
    if (!isTransfer) return []
    return accounts.filter((a) => a.id !== accountId)
  }, [accounts, isTransfer, accountId])

  // Categorias filtradas pelo tipo (INCOME / EXPENSE)
  const filteredCategories = useMemo(() => {
    if (isTransfer) return [] // transferências não possuem categoria
    return categories.filter((c) => c.type === type)
  }, [categories, type, isTransfer])

  // Preview das parcelas
  const installmentPreview = useMemo(() => {
    if (!showInstallments) return null
    const n = Math.max(1, Number(totalInstallments) || 1)
    const total = Number(amount) || 0
    if (n <= 1 || total <= 0) return null

    const perInstallment = Math.round((total / n) * 100) / 100
    const baseDate = new Date(date + 'T12:00:00')
    const items: { label: string; date: string; amount: number }[] = []

    for (let i = 0; i < n; i++) {
      const d = new Date(baseDate)
      d.setMonth(d.getMonth() + i)
      items.push({
        label: `${i + 1}/${n}`,
        date: getLocalISODate(d),
        amount: perInstallment,
      })
    }

    return items
  }, [showInstallments, totalInstallments, amount, date])

  // Auto-selecionar primeira conta quando as opções mudam
  useEffect(() => {
    if (availableAccounts.length > 0 && !availableAccounts.find((a) => a.id === accountId)) {
      setAccountId(availableAccounts[0].id)
    }
  }, [availableAccounts, accountId])

  // Reset payment method quando muda o tipo
  useEffect(() => {
    if (type === 'TRANSFER') {
      setPaymentMethod('PIX')
      setCategoryId('')
      setTotalInstallments('1')
    }
    if (type === 'INCOME') {
      if (paymentMethod === 'CREDIT') setPaymentMethod('PIX')
      setTotalInstallments('1')
    }
  }, [type])

  // ----- Submit -----
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsedAmount = Number(amount)
    if (!description.trim()) {
      setError('A descrição é obrigatória.')
      return
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('O valor deve ser maior que zero.')
      return
    }
    if (!accountId) {
      setError('Selecione uma conta.')
      return
    }
    if (isTransfer && !destinationAccountId) {
      setError('Selecione a conta de destino.')
      return
    }
    if (isTransfer && accountId === destinationAccountId) {
      setError('A conta de destino deve ser diferente da origem.')
      return
    }

    const parsedInstallments = showInstallments
      ? Math.max(1, Math.floor(Number(totalInstallments) || 1))
      : 1

    const payload: NewTransactionPayload = {
      account_id: accountId,
      destination_account_id: isTransfer ? destinationAccountId : null,
      category_id: categoryId || null,
      type,
      payment_method: isTransfer ? 'PIX' : paymentMethod,
      description: description.trim(),
      amount: parsedAmount,
      date,
      total_installments: parsedInstallments,
    }

    const success = await onSubmit(payload)

    if (!success) {
      setError('Erro ao salvar transação. Tente novamente.')
      return
    }

    // Reset
    setDescription('')
    setAmount('')
    setDate(getLocalISODate())
    setTotalInstallments('1')
    setCategoryId('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---- Tipo de transação (tabs) ---- */}
      <div className="flex gap-1 rounded-lg bg-slate-800/60 p-1">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${type === opt.value
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* ---- Descrição ---- */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-description">Descrição *</Label>
        <Input
          id="tx-description"
          placeholder="Ex: Supermercado, Salário, Aluguel..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          autoFocus
        />
      </div>

      {/* ---- Valor ---- */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-amount">Valor (R$) *</Label>
        <Input
          id="tx-amount"
          type="number"
          placeholder="0,00"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {/* ---- Data ---- */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-date">Data</Label>
        <Input
          id="tx-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* ---- Meio de pagamento (oculto em transferência) ---- */}
      {!isTransfer && (
        <div className="space-y-1.5">
          <Label htmlFor="tx-payment">Meio de pagamento</Label>
          <Select
            id="tx-payment"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          >
            {PAYMENT_OPTIONS
              .filter((p) => {
                // Receita não aceita crédito
                if (type === 'INCOME' && p.value === 'CREDIT') return false
                return true
              })
              .map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
          </Select>
        </div>
      )}

      {/* ---- Conta de origem ---- */}
      <div className="space-y-1.5">
        <Label htmlFor="tx-account">
          {isTransfer ? 'Conta de origem' : 'Conta'}
        </Label>
        <Select
          id="tx-account"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          <option value="" disabled>Selecione a conta</option>
          {availableAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({acc.type === 'CREDIT' ? 'Crédito' : acc.type === 'CHECKING' ? 'Corrente' : 'Dinheiro'})
            </option>
          ))}
        </Select>
      </div>

      {/* ---- Conta de destino (apenas transferência) ---- */}
      {isTransfer && (
        <div className="space-y-1.5">
          <Label htmlFor="tx-dest-account" className="flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-400" />
            Conta de destino
          </Label>
          <Select
            id="tx-dest-account"
            value={destinationAccountId}
            onChange={(e) => setDestinationAccountId(e.target.value)}
          >
            <option value="" disabled>Selecione o destino</option>
            {destinationAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type === 'CREDIT' ? 'Crédito' : acc.type === 'CHECKING' ? 'Corrente' : 'Dinheiro'})
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* ---- Categoria (oculta em transferência) ---- */}
      {!isTransfer && (
        <div className="space-y-1.5">
          <Label htmlFor="tx-category">Categoria</Label>
          <Select
            id="tx-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Sem categoria</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* ---- Parcelamento (apenas crédito + despesa) ---- */}
      {showInstallments && (
        <div className="space-y-1.5">
          <Label htmlFor="tx-installments" className="flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-slate-400" />
            Parcelas
          </Label>
          <Input
            id="tx-installments"
            type="number"
            min={1}
            max={48}
            value={totalInstallments}
            onChange={(e) => setTotalInstallments(e.target.value)}
          />
        </div>
      )}

      {/* ---- Preview de parcelas ---- */}
      {installmentPreview && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <CreditCard className="h-3.5 w-3.5" />
            Previsão de parcelas
          </p>
          <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
            {installmentPreview.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md bg-slate-900/50 px-2.5 py-1.5 text-xs"
              >
                <span className="font-medium text-slate-300">{item.label}</span>
                <span className="text-slate-500">{item.date}</span>
                <span className="font-mono text-emerald-400">
                  R$ {item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 pt-1">
            Cada parcela será vinculada à fatura do mês correspondente.
          </p>
        </div>
      )}

      {/* ---- Erro ---- */}
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {/* ---- Ações ---- */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {isTransfer ? 'Transferir' : 'Registrar'}
        </Button>
      </div>
    </form>
  )
}
