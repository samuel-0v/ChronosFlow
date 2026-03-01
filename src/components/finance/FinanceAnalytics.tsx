import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingDown, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/formatCurrency'
import type { TransactionWithDetails, FinanceCategory } from '@/types/finance'

// ===================== Props =====================

interface FinanceAnalyticsProps {
  transactions: TransactionWithDetails[]
  categories: FinanceCategory[]
}

// ===================== Helpers =====================

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

/** Fallback colors quando a categoria não tem color_hex */
const FALLBACK_COLORS = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#22c55e', '#eab308', '#f97316',
  '#ef4444', '#ec4899', '#a855f7', '#64748b',
]

// ===================== Custom Tooltip =====================

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-slate-300">{item.name}</p>
      <p className="text-sm font-bold text-slate-100">{formatCurrency(item.value)}</p>
      <p className="text-[11px] text-slate-500">{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-bold text-slate-100">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ===================== Component =====================

export function FinanceAnalytics({ transactions, categories }: FinanceAnalyticsProps) {
  // ---- Pie Chart: Despesas por categoria (mês atual) ----
  const pieData = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const expenses = transactions.filter((t) => {
      if (t.type !== 'EXPENSE') return false
      const d = new Date(t.date + 'T12:00:00')
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
    })

    // Agrupa por category_id
    const grouped = new Map<string, { name: string; value: number; color: string }>()

    for (const tx of expenses) {
      const catId = tx.category_id ?? '__sem_categoria__'
      const existing = grouped.get(catId)

      if (existing) {
        existing.value += tx.amount
      } else {
        const cat = categories.find((c) => c.id === catId)
        grouped.set(catId, {
          name: cat?.name ?? 'Sem categoria',
          value: tx.amount,
          color: cat?.color_hex ?? FALLBACK_COLORS[grouped.size % FALLBACK_COLORS.length],
        })
      }
    }

    const data = Array.from(grouped.values()).sort((a, b) => b.value - a.value)
    const total = data.reduce((sum, d) => sum + d.value, 0)

    return data.map((d) => ({ ...d, percent: total > 0 ? d.value / total : 0 }))
  }, [transactions, categories])

  // ---- Bar Chart: Receita vs Despesa (últimos 6 meses) ----
  const barData = useMemo(() => {
    const now = new Date()
    const months: { month: number; year: number; label: string }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: `${MONTH_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      })
    }

    return months.map(({ month, year, label }) => {
      let income = 0
      let expense = 0

      for (const tx of transactions) {
        const d = new Date(tx.date + 'T12:00:00')
        if (d.getMonth() + 1 !== month || d.getFullYear() !== year) continue
        if (tx.type === 'INCOME') income += tx.amount
        if (tx.type === 'EXPENSE') expense += tx.amount
      }

      return { label, Receitas: income, Despesas: expense }
    })
  }, [transactions])

  // ---- Totais do mês atual ----
  const monthTotals = useMemo(() => {
    const now = new Date()
    const m = now.getMonth() + 1
    const y = now.getFullYear()

    let income = 0
    let expense = 0

    for (const tx of transactions) {
      const d = new Date(tx.date + 'T12:00:00')
      if (d.getMonth() + 1 !== m || d.getFullYear() !== y) continue
      if (tx.type === 'INCOME') income += tx.amount
      if (tx.type === 'EXPENSE') expense += tx.amount
    }

    return { income, expense, balance: income - expense }
  }, [transactions])

  const currentMonthLabel = `${MONTH_SHORT[new Date().getMonth()]}/${new Date().getFullYear()}`

  return (
    <div className="space-y-6">
      {/* ---- Resumo do mês ---- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Receitas — {currentMonthLabel}
          </div>
          <p className="mt-1 text-lg font-bold text-emerald-400">
            {formatCurrency(monthTotals.income)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            Despesas — {currentMonthLabel}
          </div>
          <p className="mt-1 text-lg font-bold text-red-400">
            {formatCurrency(monthTotals.expense)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <BarChart3 className="h-3.5 w-3.5 text-primary-400" />
            Balanço — {currentMonthLabel}
          </div>
          <p
            className={`mt-1 text-lg font-bold ${
              monthTotals.balance >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(monthTotals.balance)}
          </p>
        </div>
      </div>

      {/* ---- Charts Grid ---- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart — Despesas por categoria */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Despesas por Categoria
            </h3>
            <span className="text-xs text-slate-500">({currentMonthLabel})</span>
          </div>

          {pieData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-slate-600">
              Nenhuma despesa registrada este mês.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda */}
              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
                {pieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="truncate text-slate-400">{entry.name}</span>
                    <span className="ml-auto shrink-0 font-medium text-slate-300">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart — Receita vs Despesa por mês */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Receitas vs Despesas
            </h3>
            <span className="text-xs text-slate-500">(últimos 6 meses)</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => {
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
                  return String(v)
                }}
              />
              <Tooltip content={<BarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Receitas" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
