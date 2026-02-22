// Barrel export para todos os tipos do projeto
export * from './database'

// ----- Tipos compostos compartilhados -----

import type { TimeEntry, Task, Category, Pause } from './database'

/** TimeEntry com joins de categories, tasks e pauses (usado no Timesheet) */
export type TimeEntryWithDetails = TimeEntry & {
  categories: Pick<Category, 'name' | 'color_hex'> | null
  tasks: Pick<Task, 'title'> | null
  pauses: Pause[]
}

/** Entries agrupadas por dia (chave = 'YYYY-MM-DD') */
export type GroupedEntries = Record<string, TimeEntryWithDetails[]>
