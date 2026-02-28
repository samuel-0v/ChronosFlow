// ==========================================
// ChronosFlow - useFinance Hook
// ==========================================
// Hook central do módulo financeiro.
// Gerencia contas, categorias, faturas e transações.
// Lida com a lógica de parcelamento (gera N linhas de crédito).

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getLocalISODate } from '@/lib/formatTime'
import type {
  FinanceAccount,
  FinanceAccountInsert,
  FinanceAccountUpdate,
  FinanceBill,
  FinanceBillInsert,
  FinanceCategory,
  FinanceCategoryInsert,
  FinanceCategoryUpdate,
  FinanceTransactionInsert,
  FinanceTransactionUpdate,
  TransactionWithDetails,
  BillWithAccount,
  NewTransactionPayload,
} from '@/types/finance'

// ===================== Tipos de retorno =====================

interface UseFinanceCategoriesReturn {
  categories: FinanceCategory[]
  isLoading: boolean
  createCategory: (data: Omit<FinanceCategoryInsert, 'user_id'>) => Promise<boolean>
  updateCategory: (id: string, data: FinanceCategoryUpdate) => Promise<boolean>
  deleteCategory: (id: string) => Promise<boolean>
  refetch: () => void
}

interface UseFinanceAccountsReturn {
  accounts: FinanceAccount[]
  isLoading: boolean
  createAccount: (data: Omit<FinanceAccountInsert, 'user_id'>) => Promise<boolean>
  createHybridAccount: (data: {
    name: string
    balance: number
    closing_day: number
    due_day: number
  }) => Promise<boolean>
  updateAccount: (id: string, data: FinanceAccountUpdate) => Promise<boolean>
  updateAccountBalance: (id: string, balance: number) => Promise<boolean>
  deleteAccount: (id: string) => Promise<boolean>
  refetch: () => void
}

interface UseFinanceBillsReturn {
  bills: BillWithAccount[]
  isLoading: boolean
  getOrCreateBill: (accountId: string, month: number, year: number) => Promise<FinanceBill | null>
  updateBillStatus: (id: string, status: FinanceBill['status']) => Promise<boolean>
  payBill: (billId: string, sourceAccountId: string) => Promise<boolean>
  refetch: () => void
}

interface UseFinanceTransactionsReturn {
  transactions: TransactionWithDetails[]
  isLoading: boolean
  isSubmitting: boolean
  createTransaction: (payload: NewTransactionPayload) => Promise<boolean>
  updateTransaction: (id: string, data: FinanceTransactionUpdate) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  refetch: () => void
}

export interface UseFinanceReturn {
  categories: UseFinanceCategoriesReturn
  accounts: UseFinanceAccountsReturn
  bills: UseFinanceBillsReturn
  transactions: UseFinanceTransactionsReturn
}

// ===================== Hook principal =====================

export function useFinance(): UseFinanceReturn {
  const { user } = useAuth()

  // ---------- State: categorias ----------
  const [rawCategories, setRawCategories] = useState<FinanceCategory[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catTick, setCatTick] = useState(0)
  const refetchCategories = useCallback(() => setCatTick((t) => t + 1), [])

  // ---------- State: contas ----------
  const [rawAccounts, setRawAccounts] = useState<FinanceAccount[]>([])
  const [accLoading, setAccLoading] = useState(true)
  const [accTick, setAccTick] = useState(0)
  const refetchAccounts = useCallback(() => setAccTick((t) => t + 1), [])

  // ---------- State: faturas ----------
  const [rawBills, setRawBills] = useState<BillWithAccount[]>([])
  const [billsLoading, setBillsLoading] = useState(true)
  const [billsTick, setBillsTick] = useState(0)
  const refetchBills = useCallback(() => setBillsTick((t) => t + 1), [])

  // ---------- State: transações ----------
  const [rawTransactions, setRawTransactions] = useState<TransactionWithDetails[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [txSubmitting, setTxSubmitting] = useState(false)
  const [txTick, setTxTick] = useState(0)
  const refetchTransactions = useCallback(() => setTxTick((t) => t + 1), [])

  // ===================== Fetches =====================

  // -- Categorias financeiras
  useEffect(() => {
    if (!user) { setRawCategories([]); setCatLoading(false); return }
    setCatLoading(true)

    supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data, error }) => {
        if (error) console.error('[useFinance] Erro categorias:', error.message)
        setRawCategories((data as FinanceCategory[]) ?? [])
        setCatLoading(false)
      })
  }, [user, catTick])

  // -- Contas
  useEffect(() => {
    if (!user) { setRawAccounts([]); setAccLoading(false); return }
    setAccLoading(true)

    supabase
      .from('finance_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data, error }) => {
        if (error) console.error('[useFinance] Erro contas:', error.message)
        setRawAccounts((data as FinanceAccount[]) ?? [])
        setAccLoading(false)
      })
  }, [user, accTick])

  // -- Faturas
  useEffect(() => {
    if (!user) { setRawBills([]); setBillsLoading(false); return }
    setBillsLoading(true)

    supabase
      .from('finance_bills')
      .select('*, finance_accounts(name)')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[useFinance] Erro faturas:', error.message)
        setRawBills((data as BillWithAccount[]) ?? [])
        setBillsLoading(false)
      })
  }, [user, billsTick])

  // -- Transações
  useEffect(() => {
    if (!user) { setRawTransactions([]); setTxLoading(false); return }
    if (rawTransactions.length === 0) setTxLoading(true)

    supabase
      .from('finance_transactions')
      .select('*, finance_categories(name, color_hex, type), finance_accounts!finance_transactions_account_id_fkey(name, type)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[useFinance] Erro transações:', error.message)
        setRawTransactions((data as unknown as TransactionWithDetails[]) ?? [])
        setTxLoading(false)
      })
  }, [user, txTick])

  // ===================== Mutations: Categorias =====================

  const createCategory = useCallback(
    async (data: Omit<FinanceCategoryInsert, 'user_id'>): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_categories')
        .insert([{ ...data, user_id: user.id }])

      if (error) {
        console.error('[useFinance] Erro ao criar categoria:', error.message)
        return false
      }
      refetchCategories()
      return true
    },
    [user, refetchCategories],
  )

  const updateCategory = useCallback(
    async (id: string, data: FinanceCategoryUpdate): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_categories')
        .update(data)
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao atualizar categoria:', error.message)
        return false
      }
      refetchCategories()
      return true
    },
    [user, refetchCategories],
  )

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_categories')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao deletar categoria:', error.message)
        return false
      }
      refetchCategories()
      return true
    },
    [user, refetchCategories],
  )

  // ===================== Mutations: Contas =====================

  const createAccount = useCallback(
    async (data: Omit<FinanceAccountInsert, 'user_id'>): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_accounts')
        .insert([{ ...data, user_id: user.id }])

      if (error) {
        console.error('[useFinance] Erro ao criar conta:', error.message)
        return false
      }
      refetchAccounts()
      return true
    },
    [user, refetchAccounts],
  )

  /** Cria conta corrente + cartão de crédito atrelado em batch */
  const createHybridAccount = useCallback(
    async (data: { name: string; balance: number; closing_day: number; due_day: number }): Promise<boolean> => {
      if (!user) return false

      const rows: FinanceAccountInsert[] = [
        {
          user_id: user.id,
          name: data.name,
          type: 'CHECKING',
          balance: data.balance,
          closing_day: null,
          due_day: null,
        },
        {
          user_id: user.id,
          name: `${data.name} - Cartão`,
          type: 'CREDIT',
          balance: 0,
          closing_day: data.closing_day,
          due_day: data.due_day,
        },
      ]

      const { error } = await supabase.from('finance_accounts').insert(rows)

      if (error) {
        console.error('[useFinance] Erro ao criar conta híbrida:', error.message)
        return false
      }
      refetchAccounts()
      return true
    },
    [user, refetchAccounts],
  )

  /** Atualiza apenas o saldo de uma conta */
  const updateAccountBalance = useCallback(
    async (id: string, balance: number): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_accounts')
        .update({ balance })
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao atualizar saldo:', error.message)
        return false
      }
      refetchAccounts()
      return true
    },
    [user, refetchAccounts],
  )

  const updateAccount = useCallback(
    async (id: string, data: FinanceAccountUpdate): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_accounts')
        .update(data)
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao atualizar conta:', error.message)
        return false
      }
      refetchAccounts()
      return true
    },
    [user, refetchAccounts],
  )

  const deleteAccount = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao deletar conta:', error.message)
        return false
      }
      refetchAccounts()
      return true
    },
    [user, refetchAccounts],
  )

  // ===================== Bills: get-or-create =====================

  const getOrCreateBill = useCallback(
    async (accountId: string, month: number, year: number): Promise<FinanceBill | null> => {
      if (!user) return null

      // Tenta buscar a fatura existente (UNIQUE constraint garante no máx 1)
      const { data: existing, error: fetchErr } = await supabase
        .from('finance_bills')
        .select('*')
        .eq('account_id', accountId)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle()

      if (fetchErr) {
        console.error('[useFinance] Erro ao buscar fatura:', fetchErr.message)
        return null
      }

      if (existing) return existing as FinanceBill

      // Busca due_day da conta (cartão de crédito) para calcular due_date
      const account = rawAccounts.find((a) => a.id === accountId)
      const dueDay = account?.due_day ?? 10
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

      const newBill: FinanceBillInsert = {
        user_id: user.id,
        account_id: accountId,
        month,
        year,
        status: 'OPEN',
        due_date: dueDate,
      }

      const { data: created, error: insertErr } = await supabase
        .from('finance_bills')
        .insert([newBill])
        .select('*')
        .single()

      if (insertErr) {
        console.error('[useFinance] Erro ao criar fatura:', insertErr.message)
        return null
      }

      refetchBills()
      return created as FinanceBill
    },
    [user, rawAccounts, refetchBills],
  )

  const updateBillStatus = useCallback(
    async (id: string, status: FinanceBill['status']): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_bills')
        .update({ status })
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao atualizar fatura:', error.message)
        return false
      }
      refetchBills()
      return true
    },
    [user, refetchBills],
  )

  /**
   * payBill — Paga uma fatura de cartão de crédito.
   *
   * Regra de ouro: pagar fatura NÃO é despesa, é uma TRANSFERÊNCIA
   * da conta corrente/dinheiro para a conta do cartão de crédito.
   *
   * Fluxo:
   *   1. Busca detalhes da fatura (total_amount, account_id do cartão)
   *   2. Atualiza bill.status = 'PAID'
   *   3. Atualiza todas as transações vinculadas (bill_id) para status = 'PAID'
   *   4. Insere transação de TRANSFER da conta origem para o cartão
   */
  const payBill = useCallback(
    async (billId: string, sourceAccountId: string): Promise<boolean> => {
      if (!user) return false

      try {
        // 1) Busca a fatura
        const { data: bill, error: billErr } = await supabase
          .from('finance_bills')
          .select('id, total_amount, account_id, month, year')
          .eq('id', billId)
          .single()

        if (billErr || !bill) {
          console.error('[useFinance] payBill — erro ao buscar fatura:', billErr?.message)
          return false
        }

        // 2) Marca a fatura como PAID
        const { error: updateBillErr } = await supabase
          .from('finance_bills')
          .update({ status: 'PAID' as const })
          .eq('id', billId)

        if (updateBillErr) {
          console.error('[useFinance] payBill — erro ao atualizar fatura:', updateBillErr.message)
          return false
        }

        // 3) Marca todas as transações da fatura como PAID
        const { error: updateTxErr } = await supabase
          .from('finance_transactions')
          .update({ status: 'PAID' as const })
          .eq('bill_id', billId)

        if (updateTxErr) {
          console.error('[useFinance] payBill — erro ao validar transações:', updateTxErr.message)
          // Fatura já está PAID, mas transações falharam — alertar
          return false
        }

        // 4) Determina o payment_method pela conta de origem
        const sourceAccount = rawAccounts.find((a) => a.id === sourceAccountId)
        const pm = sourceAccount?.type === 'CASH' ? 'CASH' : 'DEBIT'

        const transferRow: FinanceTransactionInsert = {
          user_id: user.id,
          account_id: sourceAccountId,
          destination_account_id: bill.account_id,
          type: 'TRANSFER',
          payment_method: pm,
          description: `Pagamento de Fatura — ${String(bill.month).padStart(2, '0')}/${bill.year}`,
          amount: bill.total_amount,
          date: getLocalISODate(),
          status: 'PAID',
          is_installment: false,
        }

        const { error: insertErr } = await supabase
          .from('finance_transactions')
          .insert([transferRow])

        if (insertErr) {
          console.error('[useFinance] payBill — erro ao inserir transferência:', insertErr.message)
          return false
        }

        // Sucesso — recarrega tudo
        refetchBills()
        refetchTransactions()
        refetchAccounts()
        return true
      } catch (err) {
        console.error('[useFinance] payBill — erro inesperado:', err)
        return false
      }
    },
    [user, rawAccounts, refetchBills, refetchTransactions, refetchAccounts],
  )

  // ===================== Mutations: Transações =====================

  /**
   * createTransaction — Ponto central para inserir transações.
   *
   * Se `total_installments > 1` e `payment_method === 'CREDIT'`:
   *   1. Insere a transação-mãe (installment_number = 1)
   *   2. Gera N-1 filhas com installment_number 2..N e datas nos meses subsequentes
   *   3. Para cada parcela, faz get-or-create da fatura do mês correspondente
   *
   * Transações de crédito sempre nascem com status = 'PENDING'.
   * Transações de débito/pix/dinheiro nascem com status = 'PAID'.
   */
  const createTransaction = useCallback(
    async (payload: NewTransactionPayload): Promise<boolean> => {
      if (!user) return false
      setTxSubmitting(true)

      const {
        account_id,
        destination_account_id,
        category_id,
        type,
        payment_method,
        description,
        amount,
        date,
        total_installments,
      } = payload

      const isCredit = payment_method === 'CREDIT'
      const isInstallment = isCredit && total_installments > 1
      const baseStatus = isCredit ? 'PENDING' : 'PAID'

      try {
        // ---- Parcelamento (Crédito com N > 1) ----
        if (isInstallment) {
          const installmentAmount = Math.round((amount / total_installments) * 100) / 100

          // Calcula datas das parcelas (1 mês de diferença para cada uma)
          const baseDate = new Date(date + 'T12:00:00')
          const installmentDates: string[] = []
          for (let i = 0; i < total_installments; i++) {
            const d = new Date(baseDate)
            d.setMonth(d.getMonth() + i)
            installmentDates.push(getLocalISODate(d))
          }

          // 1) Buscar/criar faturas para cada mês
          const billIds: (string | null)[] = []
          for (const instDate of installmentDates) {
            const d = new Date(instDate + 'T12:00:00')
            const bill = await getOrCreateBill(account_id, d.getMonth() + 1, d.getFullYear())
            billIds.push(bill?.id ?? null)
          }

          // 2) Insere parcela-mãe (installment_number = 1)
          const parentRow: FinanceTransactionInsert = {
            user_id: user.id,
            account_id,
            category_id: category_id ?? null,
            bill_id: billIds[0],
            type,
            payment_method,
            description: `${description} (1/${total_installments})`,
            amount: installmentAmount,
            date: installmentDates[0],
            is_installment: true,
            installment_number: 1,
            total_installments,
            status: baseStatus,
          }

          const { data: parentData, error: parentErr } = await supabase
            .from('finance_transactions')
            .insert([parentRow])
            .select('id')
            .single()

          if (parentErr || !parentData) {
            console.error('[useFinance] Erro parcela-mãe:', parentErr?.message)
            setTxSubmitting(false)
            return false
          }

          const parentId = parentData.id

          // 3) Insere parcelas-filhas (2..N)
          if (total_installments > 1) {
            const childRows: FinanceTransactionInsert[] = []
            for (let i = 1; i < total_installments; i++) {
              childRows.push({
                user_id: user.id,
                account_id,
                category_id: category_id ?? null,
                bill_id: billIds[i],
                type,
                payment_method,
                description: `${description} (${i + 1}/${total_installments})`,
                amount: installmentAmount,
                date: installmentDates[i],
                is_installment: true,
                installment_number: i + 1,
                total_installments,
                parent_transaction_id: parentId,
                status: baseStatus,
              })
            }

            const { error: childErr } = await supabase
              .from('finance_transactions')
              .insert(childRows)

            if (childErr) {
              console.error('[useFinance] Erro parcelas-filhas:', childErr.message)
              setTxSubmitting(false)
              return false
            }
          }
        } else {
          // ---- Transação simples (à vista / débito / pix / dinheiro / crédito 1x) ----
          let billId: string | null = null

          // Se for crédito (mesmo 1x), vincula à fatura do mês
          if (isCredit) {
            const d = new Date(date + 'T12:00:00')
            const bill = await getOrCreateBill(account_id, d.getMonth() + 1, d.getFullYear())
            billId = bill?.id ?? null
          }

          const row: FinanceTransactionInsert = {
            user_id: user.id,
            account_id,
            destination_account_id: destination_account_id ?? null,
            category_id: category_id ?? null,
            bill_id: billId,
            type,
            payment_method,
            description: description.trim(),
            amount,
            date,
            is_installment: false,
            status: baseStatus,
          }

          const { error: insertErr } = await supabase
            .from('finance_transactions')
            .insert([row])

          if (insertErr) {
            console.error('[useFinance] Erro ao criar transação:', insertErr.message)
            setTxSubmitting(false)
            return false
          }
        }

        // Sucesso — recarrega dados relevantes
        refetchTransactions()
        refetchBills()
        refetchAccounts() // Saldo atualizado pelos triggers
        setTxSubmitting(false)
        return true
      } catch (err) {
        console.error('[useFinance] Erro inesperado:', err)
        setTxSubmitting(false)
        return false
      }
    },
    [user, getOrCreateBill, refetchTransactions, refetchBills, refetchAccounts],
  )

  const updateTransaction = useCallback(
    async (id: string, data: FinanceTransactionUpdate): Promise<boolean> => {
      if (!user) return false
      setTxSubmitting(true)

      const { error } = await supabase
        .from('finance_transactions')
        .update(data)
        .eq('id', id)

      setTxSubmitting(false)

      if (error) {
        console.error('[useFinance] Erro ao atualizar transação:', error.message)
        return false
      }

      refetchTransactions()
      refetchAccounts()
      return true
    },
    [user, refetchTransactions, refetchAccounts],
  )

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false
      setTxSubmitting(true)

      // Deletar a transação (cascade cuida das filhas se for parent)
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id)

      setTxSubmitting(false)

      if (error) {
        console.error('[useFinance] Erro ao deletar transação:', error.message)
        return false
      }

      refetchTransactions()
      refetchBills()
      refetchAccounts()
      return true
    },
    [user, refetchTransactions, refetchBills, refetchAccounts],
  )

  // ===================== Retorno =====================

  return {
    categories: {
      categories: rawCategories,
      isLoading: catLoading,
      createCategory,
      updateCategory,
      deleteCategory,
      refetch: refetchCategories,
    },
    accounts: {
      accounts: rawAccounts,
      isLoading: accLoading,
      createAccount,
      createHybridAccount,
      updateAccount,
      updateAccountBalance,
      deleteAccount,
      refetch: refetchAccounts,
    },
    bills: {
      bills: rawBills,
      isLoading: billsLoading,
      getOrCreateBill,
      updateBillStatus,
      payBill,
      refetch: refetchBills,
    },
    transactions: {
      transactions: rawTransactions,
      isLoading: txLoading,
      isSubmitting: txSubmitting,
      createTransaction,
      updateTransaction,
      deleteTransaction,
      refetch: refetchTransactions,
    },
  }
}
