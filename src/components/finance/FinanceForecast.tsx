import { useMemo } from 'react'
import { AlertTriangle, TrendingUp, Calendar, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/formatCurrency'
import type { FinanceAccount, BillWithAccount, TransactionWithDetails } from '@/types/finance'

// ===================== Props =====================

interface FinanceForecastProps {
  accounts: FinanceAccount[]
  bills: BillWithAccount[]
  transactions: TransactionWithDetails[]
}

// ===================== Helpers =====================

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// ===================== Component =====================

export function FinanceForecast({ accounts, bills, transactions }: FinanceForecastProps) {
  // ---- Saldo de caixa atual (CHECKING + CASH) ----
  const currentCash = useMemo(
    () =>
      accounts
        .filter((a) => a.type === 'CHECKING' || a.type === 'CASH')
        .reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  )

  // ---- Média mensal de receitas/despesas (últimos 3 meses) ----
  const monthlyAverages = useMemo(() => {
    const now = new Date()
    let totalIncome = 0
    let totalExpense = 0
    let monthCount = 0

    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()

      let hasData = false

      for (const tx of transactions) {
        const txDate = new Date(tx.date + 'T12:00:00')
        if (txDate.getMonth() + 1 !== m || txDate.getFullYear() !== y) continue
        if (tx.type === 'INCOME') { totalIncome += tx.amount; hasData = true }
        if (tx.type === 'EXPENSE') { totalExpense += tx.amount; hasData = true }
      }

      if (hasData) monthCount++
    }

    return {
      avgIncome: monthCount > 0 ? totalIncome / monthCount : 0,
      avgExpense: monthCount > 0 ? totalExpense / monthCount : 0,
    }
  }, [transactions])

  // ---- Projeção dos próximos 3 meses ----
  const forecast = useMemo(() => {
    const now = new Date()
    const months: {
      month: number
      year: number
      label: string
      openBills: number
      projectedIncome: number
      projectedExpense: number
      projectedBalance: number
      isNegative: boolean
    }[] = []

    let runningBalance = currentCash

    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()

      // Faturas ABERTAS ou FECHADAS deste mês
      const monthBills = bills.filter(
        (b) => b.month === m && b.year === y && (b.status === 'OPEN' || b.status === 'CLOSED'),
      )
      const billTotal = monthBills.reduce((sum, b) => sum + b.total_amount, 0)

      // Projeção: saldo + receita média - despesa média - faturas abertas
      const projectedIncome = monthlyAverages.avgIncome
      const projectedExpense = monthlyAverages.avgExpense + billTotal

      runningBalance = runningBalance + projectedIncome - projectedExpense

      months.push({
        month: m,
        year: y,
        label: `${MONTH_NAMES[m]} ${y}`,
        openBills: billTotal,
        projectedIncome,
        projectedExpense,
        projectedBalance: runningBalance,
        isNegative: runningBalance < 0,
      })
    }

    return months
  }, [currentCash, bills, monthlyAverages])

  const hasNegative = forecast.some((m) => m.isNegative)

  return (
    <div className="space-y-6">
      {/* ---- Saldo atual ---- */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Wallet className="h-3.5 w-3.5 text-primary-400" />
          Saldo disponível atual (Corrente + Dinheiro)
        </div>
        <p className={`mt-1 text-2xl font-bold ${currentCash >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(currentCash)}
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Média mensal — Receita: {formatCurrency(monthlyAverages.avgIncome)} | Despesa: {formatCurrency(monthlyAverages.avgExpense)}
        </p>
      </div>

      {/* ---- Alerta de saldo negativo ---- */}
      {hasNegative && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-300">
              Atenção: Saldo projetado negativo
            </p>
            <p className="mt-0.5 text-xs text-amber-400/80">
              Com base nas suas médias e faturas abertas, seu saldo pode ficar negativo nos próximos meses.
              Considere reduzir gastos ou aumentar receitas.
            </p>
          </div>
        </div>
      )}

      {/* ---- Projeção por mês ---- */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <TrendingUp className="h-4 w-4 text-sky-400" />
          Projeção dos Próximos 3 Meses
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {forecast.map((m) => (
            <div
              key={`${m.month}-${m.year}`}
              className={`rounded-xl border p-4 ${
                m.isNegative
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-400">{m.label}</span>
              </div>

              <p
                className={`mt-2 text-xl font-bold ${
                  m.isNegative ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(m.projectedBalance)}
              </p>

              <div className="mt-2 space-y-0.5 text-[11px] text-slate-500">
                <p>
                  <span className="text-emerald-500">+</span> Receita estimada:{' '}
                  {formatCurrency(m.projectedIncome)}
                </p>
                <p>
                  <span className="text-red-500">−</span> Despesa estimada:{' '}
                  {formatCurrency(m.projectedExpense - m.openBills)}
                </p>
                {m.openBills > 0 && (
                  <p>
                    <span className="text-violet-500">−</span> Faturas:{' '}
                    {formatCurrency(m.openBills)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-slate-600">
          * Projeção baseada na média dos últimos 3 meses + faturas abertas/fechadas.
        </p>
      </div>
    </div>
  )
}
