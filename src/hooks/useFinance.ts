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
  FinanceBillUpdate,
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
  updateBill: (id: string, data: FinanceBillUpdate) => Promise<boolean>
  deleteBill: (id: string) => Promise<boolean>
  payBill: (billId: string, sourceAccountId: string) => Promise<{ ok: boolean; error?: string }>
  revertBillPayment: (billId: string) => Promise<{ ok: boolean; error?: string }>
  refetch: () => void
}

interface UseFinanceTransactionsReturn {
  transactions: TransactionWithDetails[]
  isLoading: boolean
  isSubmitting: boolean
  createTransaction: (payload: NewTransactionPayload) => Promise<{ ok: boolean; error?: string }>
  updateTransaction: (id: string, data: FinanceTransactionUpdate, original: TransactionWithDetails) => Promise<{ ok: boolean; error?: string }>
  deleteTransaction: (id: string) => Promise<{ ok: boolean; error?: string }>
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
    async (billId: string, sourceAccountId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Usuário não autenticado.' }

      try {
        // 1) Busca a fatura
        const { data: bill, error: billErr } = await supabase
          .from('finance_bills')
          .select('id, total_amount, account_id, month, year')
          .eq('id', billId)
          .single()

        if (billErr || !bill) {
          console.error('[useFinance] payBill — erro ao buscar fatura:', billErr?.message)
          return { ok: false, error: 'Não foi possível buscar a fatura.' }
        }

        // 2) Validação de saldo na conta de origem
        const sourceAccount = rawAccounts.find((a) => a.id === sourceAccountId)
        if (!sourceAccount) return { ok: false, error: 'Conta de origem não encontrada.' }

        if (sourceAccount.balance < bill.total_amount) {
          const falta = bill.total_amount - sourceAccount.balance
          return {
            ok: false,
            error: `Saldo insuficiente em "${sourceAccount.name}". Faltam R$ ${falta.toFixed(2)}.`,
          }
        }

        // 3) Marca a fatura como PAID
        const { error: updateBillErr } = await supabase
          .from('finance_bills')
          .update({ status: 'PAID' as const })
          .eq('id', billId)

        if (updateBillErr) {
          console.error('[useFinance] payBill — erro ao atualizar fatura:', updateBillErr.message)
          return { ok: false, error: 'Erro ao atualizar status da fatura.' }
        }

        // 4) Marca todas as transações da fatura como PAID
        const { error: updateTxErr } = await supabase
          .from('finance_transactions')
          .update({ status: 'PAID' as const })
          .eq('bill_id', billId)

        if (updateTxErr) {
          console.error('[useFinance] payBill — erro ao validar transações:', updateTxErr.message)
          return { ok: false, error: 'Erro ao validar transações da fatura.' }
        }

        // 5) Insere transação TRANSFER (conta origem → cartão)
        const pm = sourceAccount.type === 'CASH' ? 'CASH' : 'DEBIT'

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
          return { ok: false, error: 'Erro ao registrar transferência de pagamento.' }
        }

        // Sucesso — recarrega tudo
        refetchBills()
        refetchTransactions()
        refetchAccounts()
        return { ok: true }
      } catch (err) {
        console.error('[useFinance] payBill — erro inesperado:', err)
        return { ok: false, error: 'Erro inesperado ao pagar fatura.' }
      }
    },
    [user, rawAccounts, refetchBills, refetchTransactions, refetchAccounts],
  )

  /** updateBill — Atualiza campos da fatura (total_amount, due_date, status). */
  const updateBill = useCallback(
    async (id: string, data: FinanceBillUpdate): Promise<boolean> => {
      if (!user) return false

      const { error } = await supabase
        .from('finance_bills')
        .update(data)
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

  /** deleteBill — Remove uma fatura e desvincula transações. */
  const deleteBill = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false

      // Primeiro desvincula transações (seta bill_id = null)
      await supabase
        .from('finance_transactions')
        .update({ bill_id: null })
        .eq('bill_id', id)

      const { error } = await supabase
        .from('finance_bills')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('[useFinance] Erro ao deletar fatura:', error.message)
        return false
      }

      refetchBills()
      refetchTransactions()
      return true
    },
    [user, refetchBills, refetchTransactions],
  )

  /**
   * revertBillPayment — Desfaz o pagamento de uma fatura.
   *
   * Fluxo:
   *   1. Busca a transação TRANSFER com descrição "Pagamento de Fatura" vinculada à conta do cartão
   *   2. Deleta essa transação (o trigger do banco reverte os saldos)
   *   3. Marca todas as transações da fatura como PENDING novamente
   *   4. Atualiza o status da fatura para CLOSED
   */
  const revertBillPayment = useCallback(
    async (billId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Usuário não autenticado.' }

      try {
        // 1) Busca a fatura para saber account_id, month, year
        const bill = rawBills.find((b) => b.id === billId)
        if (!bill) return { ok: false, error: 'Fatura não encontrada.' }
        if (bill.status !== 'PAID') return { ok: false, error: 'A fatura não está paga.' }

        // 2) Encontra a transação TRANSFER de pagamento
        const descPattern = `Pagamento de Fatura — ${String(bill.month).padStart(2, '0')}/${bill.year}`
        const paymentTx = rawTransactions.find(
          (t) =>
            t.type === 'TRANSFER' &&
            t.destination_account_id === bill.account_id &&
            t.description === descPattern,
        )

        if (!paymentTx) {
          return { ok: false, error: 'Transação de pagamento não encontrada.' }
        }

        // 3) Valida saldo — o estorno vai debitar da conta do cartão
        const creditAccount = rawAccounts.find((a) => a.id === bill.account_id)
        if (creditAccount && creditAccount.balance < paymentTx.amount) {
          return {
            ok: false,
            error: `Não é possível desfazer: o estorno deixaria o saldo de "${creditAccount.name}" negativo.`,
          }
        }

        // 4) Deleta a transação de pagamento (trigger reverte saldos)
        const { error: deleteErr } = await supabase
          .from('finance_transactions')
          .delete()
          .eq('id', paymentTx.id)

        if (deleteErr) {
          console.error('[useFinance] revertBill — erro ao deletar tx:', deleteErr.message)
          return { ok: false, error: 'Erro ao remover transação de pagamento.' }
        }

        // 5) Marca todas as transações da fatura como PENDING
        const { error: txErr } = await supabase
          .from('finance_transactions')
          .update({ status: 'PENDING' as const })
          .eq('bill_id', billId)

        if (txErr) {
          console.error('[useFinance] revertBill — erro ao reverter status tx:', txErr.message)
          return { ok: false, error: 'Erro ao reverter status das transações.' }
        }

        // 6) Atualiza a fatura para CLOSED
        const { error: billErr } = await supabase
          .from('finance_bills')
          .update({ status: 'CLOSED' as const })
          .eq('id', billId)

        if (billErr) {
          console.error('[useFinance] revertBill — erro ao atualizar fatura:', billErr.message)
          return { ok: false, error: 'Erro ao atualizar status da fatura.' }
        }

        refetchBills()
        refetchTransactions()
        refetchAccounts()
        return { ok: true }
      } catch (err) {
        console.error('[useFinance] revertBill — erro inesperado:', err)
        return { ok: false, error: 'Erro inesperado ao desfazer pagamento.' }
      }
    },
    [user, rawBills, rawTransactions, rawAccounts, refetchBills, refetchTransactions, refetchAccounts],
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
    async (payload: NewTransactionPayload): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Usuário não autenticado.' }
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

      // ---- Validação de saldo (despesas à vista e transferências) ----
      const needsBalanceCheck =
        (!isCredit && type === 'EXPENSE') || type === 'TRANSFER'

      if (needsBalanceCheck) {
        const sourceAccount = rawAccounts.find((a) => a.id === account_id)
        if (sourceAccount && sourceAccount.balance < amount) {
          setTxSubmitting(false)
          return {
            ok: false,
            error: `Saldo insuficiente na conta "${sourceAccount.name}". Disponível: R$ ${sourceAccount.balance.toFixed(2)}.`,
          }
        }
      }

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
            return { ok: false, error: 'Erro ao criar parcela principal.' }
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
              return { ok: false, error: 'Erro ao criar parcelas.' }
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
            return { ok: false, error: 'Erro ao criar transação.' }
          }
        }

        // Sucesso — recarrega dados relevantes
        refetchTransactions()
        refetchBills()
        refetchAccounts() // Saldo atualizado pelos triggers
        setTxSubmitting(false)
        return { ok: true }
      } catch (err) {
        console.error('[useFinance] Erro inesperado:', err)
        setTxSubmitting(false)
        return { ok: false, error: 'Erro inesperado ao criar transação.' }
      }
    },
    [user, getOrCreateBill, refetchTransactions, refetchBills, refetchAccounts],
  )

  /**
   * deleteTransaction — Exclusão com validação de saldo e cascata de parcelas.
   *
   * 1. Se INCOME → verifica se estornar não deixa a conta negativa.
   * 2. Se TRANSFER → verifica se estornar não deixa a conta destino negativa.
   * 3. Se is_installment → encontra a mãe e exclui (CASCADE cuida das filhas).
   */
  const deleteTransaction = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Usuário não autenticado.' }
      setTxSubmitting(true)

      // 1) Busca a transação completa (precisamos dos detalhes)
      const tx = rawTransactions.find((t) => t.id === id)
      if (!tx) {
        setTxSubmitting(false)
        return { ok: false, error: 'Transação não encontrada.' }
      }

      // 2) Validação de saldo — impedir estorno que deixa conta negativa
      if (tx.type === 'INCOME') {
        const account = rawAccounts.find((a) => a.id === tx.account_id)
        if (account && account.balance < tx.amount) {
          setTxSubmitting(false)
          return {
            ok: false,
            error: `Não é possível excluir: o estorno deixaria o saldo de "${account.name}" negativo.`,
          }
        }
      }

      if (tx.type === 'TRANSFER' && tx.destination_account_id) {
        const destAccount = rawAccounts.find((a) => a.id === tx.destination_account_id)
        if (destAccount && destAccount.balance < tx.amount) {
          setTxSubmitting(false)
          return {
            ok: false,
            error: `Não é possível excluir: o estorno deixaria o saldo de "${destAccount.name}" negativo.`,
          }
        }
      }

      // 3) Se é parcela, encontra a mãe para deletar em cascata
      let deleteId = id
      if (tx.is_installment) {
        // Se tem parent_transaction_id → é filha, usa o pai
        // Senão → é a própria mãe
        deleteId = tx.parent_transaction_id ?? tx.id
      }

      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', deleteId)

      setTxSubmitting(false)

      if (error) {
        console.error('[useFinance] Erro ao deletar transação:', error.message)
        return { ok: false, error: 'Erro ao deletar transação.' }
      }

      refetchTransactions()
      refetchBills()
      refetchAccounts()
      return { ok: true }
    },
    [user, rawTransactions, rawAccounts, refetchTransactions, refetchBills, refetchAccounts],
  )

  /**
   * updateTransaction — Edição inteligente.
   *
   * Como as triggers SQL de saldo só disparam em INSERT/DELETE (não UPDATE),
   * se o usuário alterou campos financeiros (amount, type, account_id, payment_method)
   * a estratégia é: deleteTransaction(antiga) → createTransaction(nova).
   *
   * Se alterou apenas campos de texto/data (description, category_id, date)
   * faz um UPDATE simples no Supabase.
   */
  const updateTransaction = useCallback(
    async (
      id: string,
      data: FinanceTransactionUpdate,
      original: TransactionWithDetails,
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: 'Usuário não autenticado.' }
      setTxSubmitting(true)

      // Detecta se houve mudança em campos financeiros
      const financialChanged =
        (data.amount !== undefined && data.amount !== original.amount) ||
        (data.type !== undefined && data.type !== original.type) ||
        (data.account_id !== undefined && data.account_id !== original.account_id) ||
        (data.payment_method !== undefined && data.payment_method !== original.payment_method)

      if (financialChanged) {
        // Estratégia delete + recreate
        const deleteResult = await deleteTransaction(id)
        if (!deleteResult.ok) {
          setTxSubmitting(false)
          return deleteResult
        }

        const newPayload: NewTransactionPayload = {
          account_id: data.account_id ?? original.account_id,
          destination_account_id: data.destination_account_id ?? original.destination_account_id,
          category_id: data.category_id ?? original.category_id,
          type: data.type ?? original.type,
          payment_method: data.payment_method ?? original.payment_method,
          description: data.description ?? original.description,
          amount: data.amount ?? original.amount,
          date: data.date ?? original.date,
          total_installments: 1, // Edição não recria parcelas
        }

        const createResult = await createTransaction(newPayload)
        setTxSubmitting(false)
        return createResult
      }

      // Campos não-financeiros → UPDATE simples
      const { error } = await supabase
        .from('finance_transactions')
        .update(data)
        .eq('id', id)

      setTxSubmitting(false)

      if (error) {
        console.error('[useFinance] Erro ao atualizar transação:', error.message)
        return { ok: false, error: 'Erro ao atualizar transação.' }
      }

      refetchTransactions()
      refetchAccounts()
      return { ok: true }
    },
    [user, refetchTransactions, refetchAccounts, deleteTransaction, createTransaction],
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
      updateBill,
      deleteBill,
      payBill,
      revertBillPayment,
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
