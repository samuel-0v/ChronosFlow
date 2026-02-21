// ==========================================
// ChronosFlow - Database Types
// ==========================================
// Tipos TypeScript gerados a partir do schema do Supabase (supabase/schema.sql).
// Esses tipos garantem type-safety em todas as operações com o banco de dados.

// ----- Enums do domínio -----

export type CategoryType = 'WORK' | 'STUDY' | 'PERSONAL'

export type TaskPriority = 1 | 2 | 3 | 4 // 1: Urgente, 2: Alta, 3: Média, 4: Baixa

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'

export type SessionType = 'WORK' | 'STUDY'

export type NoteType = 'LINK' | 'BRAIN_DUMP'

// ----- Row Types (representam uma linha completa da tabela) -----

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  work_goal_hours: number
  study_goal_hours: number
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  color_hex: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  title: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  estimated_time: number | null // minutos
  created_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  task_id: string | null
  category_id: string | null
  session_type: SessionType
  start_time: string
  end_time: string | null
  total_duration: number | null // segundos
  created_at: string
}

export interface Pause {
  id: string
  user_id: string
  time_entry_id: string
  start_time: string
  end_time: string | null
  reason: string | null
  created_at: string
}

export interface StudyNote {
  id: string
  user_id: string
  category_id: string | null
  time_entry_id: string | null
  content: string
  note_type: NoteType
  created_at: string
}

export interface Flashcard {
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

// ----- Insert Types (campos obrigatórios para criação) -----

export type ProfileInsert = Pick<Profile, 'id'> &
  Partial<Omit<Profile, 'id' | 'created_at'>>

export type CategoryInsert = Pick<Category, 'user_id' | 'name' | 'type'> &
  Partial<Pick<Category, 'color_hex'>>

export type TaskInsert = Pick<Task, 'user_id' | 'title'> &
  Partial<Omit<Task, 'id' | 'user_id' | 'title' | 'created_at'>>

export type TimeEntryInsert = Pick<TimeEntry, 'user_id' | 'session_type'> &
  Partial<Omit<TimeEntry, 'id' | 'user_id' | 'session_type' | 'created_at'>>

export type PauseInsert = Pick<Pause, 'user_id' | 'time_entry_id'> &
  Partial<Omit<Pause, 'id' | 'user_id' | 'time_entry_id' | 'created_at'>>

export type StudyNoteInsert = Pick<StudyNote, 'user_id' | 'content' | 'note_type'> &
  Partial<Omit<StudyNote, 'id' | 'user_id' | 'content' | 'note_type' | 'created_at'>>

export type FlashcardInsert = Pick<Flashcard, 'user_id' | 'front_question' | 'back_answer'> &
  Partial<Omit<Flashcard, 'id' | 'user_id' | 'front_question' | 'back_answer' | 'created_at'>>

// ----- Update Types (todos os campos são opcionais) -----

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>
export type TaskUpdate = Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
export type TimeEntryUpdate = Partial<Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>>
export type PauseUpdate = Partial<Omit<Pause, 'id' | 'user_id' | 'created_at'>>
export type StudyNoteUpdate = Partial<Omit<StudyNote, 'id' | 'user_id' | 'created_at'>>
export type FlashcardUpdate = Partial<Omit<Flashcard, 'id' | 'user_id' | 'created_at'>>

// ----- Supabase Database Type (para tipagem do client) -----

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      categories: {
        Row: Category
        Insert: CategoryInsert
        Update: CategoryUpdate
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
      time_entries: {
        Row: TimeEntry
        Insert: TimeEntryInsert
        Update: TimeEntryUpdate
      }
      pauses: {
        Row: Pause
        Insert: PauseInsert
        Update: PauseUpdate
      }
      study_notes: {
        Row: StudyNote
        Insert: StudyNoteInsert
        Update: StudyNoteUpdate
      }
      flashcards: {
        Row: Flashcard
        Insert: FlashcardInsert
        Update: FlashcardUpdate
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
    }
  }
}
