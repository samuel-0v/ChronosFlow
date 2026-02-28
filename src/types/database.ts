// ==========================================
// ChronosFlow - Database Types (Flat / Supabase-safe)
// ==========================================
// IMPORTANTE: Usar `type` (não `interface`) para Row/Insert/Update.
// Em TypeScript, interfaces NÃO estendem `Record<string, unknown>`,
// mas type aliases sim. O Supabase client exige essa compatibilidade
// via `GenericTable`, caso contrário colapsa tudo para `never`.

// ----- Enums do domínio -----

export type CategoryType = 'WORK' | 'STUDY' | 'PERSONAL'

export type TaskPriority = 1 | 2 | 3 | 4 // 1: Urgente, 2: Alta, 3: Média, 4: Baixa

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type SessionType = 'WORK' | 'STUDY'

export type NoteType = 'LINK' | 'BRAIN_DUMP'

// ===================== profiles =====================

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  work_goal_hours: number
  study_goal_hours: number
  created_at: string
}

export type ProfileInsert = {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  work_goal_hours?: number
  study_goal_hours?: number
  created_at?: string
}

export type ProfileUpdate = {
  full_name?: string | null
  avatar_url?: string | null
  work_goal_hours?: number
  study_goal_hours?: number
}

// ===================== categories =====================

export type Category = {
  id: string
  user_id: string
  name: string
  type: CategoryType
  color_hex: string
  created_at: string
}

export type CategoryInsert = {
  user_id: string
  name: string
  type: CategoryType
  id?: string
  color_hex?: string
  created_at?: string
}

export type CategoryUpdate = {
  name?: string
  type?: CategoryType
  color_hex?: string
}

// ===================== tasks =====================

export type Task = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  estimated_time: number | null
  created_at: string
}

export type TaskInsert = {
  user_id: string
  title: string
  id?: string
  category_id?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string | null
  estimated_time?: number | null
  created_at?: string
}

export type TaskUpdate = {
  category_id?: string | null
  title?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string | null
  estimated_time?: number | null
}

// ===================== time_entries =====================

export type TimeEntry = {
  id: string
  user_id: string
  task_id: string | null
  category_id: string | null
  session_type: SessionType
  start_time: string
  end_time: string | null
  total_duration: number | null
  created_at: string
}

export type TimeEntryInsert = {
  user_id: string
  session_type: SessionType
  id?: string
  task_id?: string | null
  category_id?: string | null
  start_time?: string
  end_time?: string | null
  total_duration?: number | null
  created_at?: string
}

export type TimeEntryUpdate = {
  task_id?: string | null
  category_id?: string | null
  session_type?: SessionType
  start_time?: string
  end_time?: string | null
  total_duration?: number | null
}

// ===================== pauses =====================

export type Pause = {
  id: string
  user_id: string
  time_entry_id: string
  start_time: string
  end_time: string | null
  reason: string | null
  created_at: string
}

export type PauseInsert = {
  user_id: string
  time_entry_id: string
  id?: string
  start_time?: string
  end_time?: string | null
  reason?: string | null
  created_at?: string
}

export type PauseUpdate = {
  time_entry_id?: string
  start_time?: string
  end_time?: string | null
  reason?: string | null
}

// ===================== study_notes =====================

export type StudyNote = {
  id: string
  user_id: string
  category_id: string | null
  time_entry_id: string | null
  content: string
  note_type: NoteType
  created_at: string
}

export type StudyNoteInsert = {
  user_id: string
  content: string
  note_type: NoteType
  id?: string
  category_id?: string | null
  time_entry_id?: string | null
  created_at?: string
}

export type StudyNoteUpdate = {
  category_id?: string | null
  time_entry_id?: string | null
  content?: string
  note_type?: NoteType
}

// ===================== flashcards =====================

export type Flashcard = {
  id: string
  user_id: string
  category_id: string | null
  front_question: string
  back_answer: string
  next_review: string
  interval_days: number
  ease_factor: number
  created_at: string
}

export type FlashcardInsert = {
  user_id: string
  front_question: string
  back_answer: string
  id?: string
  category_id?: string | null
  next_review?: string
  interval_days?: number
  ease_factor?: number
  created_at?: string
}

export type FlashcardUpdate = {
  category_id?: string | null
  front_question?: string
  back_answer?: string
  next_review?: string
  interval_days?: number
  ease_factor?: number
}

// ===================== Re-export finance types for Database =====================

import type {
  FinanceCategory,
  FinanceCategoryInsert,
  FinanceCategoryUpdate,
  FinanceAccount,
  FinanceAccountInsert,
  FinanceAccountUpdate,
  FinanceBill,
  FinanceBillInsert,
  FinanceBillUpdate,
  FinanceTransaction,
  FinanceTransactionInsert,
  FinanceTransactionUpdate,
  FinanceCategoryType,
  AccountType,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  BillStatus,
} from './finance'

// ===================== Database (Supabase client) =====================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: CategoryInsert
        Update: CategoryUpdate
        Relationships: [
          {
            foreignKeyName: 'categories_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
        Relationships: [
          {
            foreignKeyName: 'tasks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      time_entries: {
        Row: TimeEntry
        Insert: TimeEntryInsert
        Update: TimeEntryUpdate
        Relationships: [
          {
            foreignKeyName: 'time_entries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      pauses: {
        Row: Pause
        Insert: PauseInsert
        Update: PauseUpdate
        Relationships: [
          {
            foreignKeyName: 'pauses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pauses_time_entry_id_fkey'
            columns: ['time_entry_id']
            isOneToOne: false
            referencedRelation: 'time_entries'
            referencedColumns: ['id']
          },
        ]
      }
      study_notes: {
        Row: StudyNote
        Insert: StudyNoteInsert
        Update: StudyNoteUpdate
        Relationships: [
          {
            foreignKeyName: 'study_notes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_notes_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'study_notes_time_entry_id_fkey'
            columns: ['time_entry_id']
            isOneToOne: false
            referencedRelation: 'time_entries'
            referencedColumns: ['id']
          },
        ]
      }
      flashcards: {
        Row: Flashcard
        Insert: FlashcardInsert
        Update: FlashcardUpdate
        Relationships: [
          {
            foreignKeyName: 'flashcards_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'flashcards_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      // ===================== Finance Module =====================
      finance_categories: {
        Row: FinanceCategory
        Insert: FinanceCategoryInsert
        Update: FinanceCategoryUpdate
        Relationships: [
          {
            foreignKeyName: 'finance_categories_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      finance_accounts: {
        Row: FinanceAccount
        Insert: FinanceAccountInsert
        Update: FinanceAccountUpdate
        Relationships: [
          {
            foreignKeyName: 'finance_accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      finance_bills: {
        Row: FinanceBill
        Insert: FinanceBillInsert
        Update: FinanceBillUpdate
        Relationships: [
          {
            foreignKeyName: 'finance_bills_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_bills_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'finance_accounts'
            referencedColumns: ['id']
          },
        ]
      }
      finance_transactions: {
        Row: FinanceTransaction
        Insert: FinanceTransactionInsert
        Update: FinanceTransactionUpdate
        Relationships: [
          {
            foreignKeyName: 'finance_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'finance_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_transactions_destination_account_id_fkey'
            columns: ['destination_account_id']
            isOneToOne: false
            referencedRelation: 'finance_accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_transactions_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'finance_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_transactions_bill_id_fkey'
            columns: ['bill_id']
            isOneToOne: false
            referencedRelation: 'finance_bills'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'finance_transactions_parent_transaction_id_fkey'
            columns: ['parent_transaction_id']
            isOneToOne: false
            referencedRelation: 'finance_transactions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      category_type: CategoryType
      task_priority: TaskPriority
      task_status: TaskStatus
      session_type: SessionType
      note_type: NoteType
      finance_category_type: FinanceCategoryType
      account_type: AccountType
      transaction_type: TransactionType
      payment_method: PaymentMethod
      transaction_status: TransactionStatus
      bill_status: BillStatus
    }
  }
}