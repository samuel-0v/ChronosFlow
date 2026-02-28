// ==========================================
// ChronosFlow - Finance Module Types
// ==========================================
// Tipagem completa do módulo financeiro.
// Segue o mesmo padrão Row/Insert/Update do database.ts.

// ----- Enums do domínio financeiro -----

export type FinanceCategoryType = 'INCOME' | 'EXPENSE'

export type AccountType = 'CHECKING' | 'CREDIT' | 'CASH'

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type PaymentMethod = 'PIX' | 'DEBIT' | 'CREDIT' | 'CASH'

export type TransactionStatus = 'PENDING' | 'PAID'

export type BillStatus = 'OPEN' | 'CLOSED' | 'PAID'

// ===================== finance_categories =====================

export type FinanceCategory = {
  id: string
  user_id: string
  name: string
  type: FinanceCategoryType
  color_hex: string
  created_at: string
}

export type FinanceCategoryInsert = {
  user_id: string
  name: string
  type: FinanceCategoryType
  id?: string
  color_hex?: string
  created_at?: string
}

export type FinanceCategoryUpdate = {
  name?: string
  type?: FinanceCategoryType
  color_hex?: string
}

// ===================== finance_accounts =====================

export type FinanceAccount = {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  invested_balance: number
  closing_day: number | null
  due_day: number | null
  created_at: string
}

export type FinanceAccountInsert = {
  user_id: string
  name: string
  type: AccountType
  id?: string
  balance?: number
  invested_balance?: number
  closing_day?: number | null
  due_day?: number | null
  created_at?: string
}

export type FinanceAccountUpdate = {
  name?: string
  type?: AccountType
  balance?: number
  invested_balance?: number
  closing_day?: number | null
  due_day?: number | null
}

// ===================== finance_bills =====================

export type FinanceBill = {
  id: string
  user_id: string
  account_id: string
  month: number
  year: number
  status: BillStatus
  total_amount: number
  due_date: string | null
  created_at: string
}

export type FinanceBillInsert = {
  user_id: string
  account_id: string
  month: number
  year: number
  status: BillStatus
  id?: string
  total_amount?: number
  due_date?: string | null
  created_at?: string
}

export type FinanceBillUpdate = {
  status?: BillStatus
  total_amount?: number
  due_date?: string | null
}

// ===================== finance_transactions =====================

export type FinanceTransaction = {
  id: string
  user_id: string
  account_id: string
  destination_account_id: string | null
  category_id: string | null
  bill_id: string | null
  type: TransactionType
  payment_method: PaymentMethod
  description: string
  amount: number
  date: string
  is_installment: boolean
  installment_number: number | null
  total_installments: number | null
  parent_transaction_id: string | null
  status: TransactionStatus
  created_at: string
}

export type FinanceTransactionInsert = {
  user_id: string
  account_id: string
  type: TransactionType
  payment_method: PaymentMethod
  description: string
  amount: number
  date: string
  status: TransactionStatus
  id?: string
  destination_account_id?: string | null
  category_id?: string | null
  bill_id?: string | null
  is_installment?: boolean
  installment_number?: number | null
  total_installments?: number | null
  parent_transaction_id?: string | null
  created_at?: string
}

export type FinanceTransactionUpdate = {
  account_id?: string
  destination_account_id?: string | null
  category_id?: string | null
  bill_id?: string | null
  type?: TransactionType
  payment_method?: PaymentMethod
  description?: string
  amount?: number
  date?: string
  is_installment?: boolean
  installment_number?: number | null
  total_installments?: number | null
  parent_transaction_id?: string | null
  status?: TransactionStatus
}

// ----- Tipos compostos (joins) -----

/** Transação com dados da categoria e conta inlined */
export type TransactionWithDetails = FinanceTransaction & {
  finance_categories: Pick<FinanceCategory, 'name' | 'color_hex' | 'type'> | null
  finance_accounts: Pick<FinanceAccount, 'name' | 'type'> | null
}

/** Fatura com nome da conta vinculada */
export type BillWithAccount = FinanceBill & {
  finance_accounts: Pick<FinanceAccount, 'name'> | null
}

// ----- Payload do formulário de Nova Transação -----

export type NewTransactionPayload = {
  account_id: string
  destination_account_id?: string | null
  category_id?: string | null
  type: TransactionType
  payment_method: PaymentMethod
  description: string
  amount: number
  date: string
  /** Se > 1, será parcelado (gera N rows com installment_number) */
  total_installments: number
}
