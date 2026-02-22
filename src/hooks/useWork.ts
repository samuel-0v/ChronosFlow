// ==========================================
// ChronosFlow - useWork Hook
// ==========================================
// Busca tarefas de trabalho (categorias WORK) e time_entries recentes
// do tipo WORK. Expõe updateTaskStatus para mover cards no Kanban.

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Task, Category, TaskStatus, TimeEntryWithDetails, GroupedEntries } from '@/types'

// ----- Tipos auxiliares -----

export type TaskWithCategory = Task & {
  categories: Pick<Category, 'name' | 'color_hex'> | null
}

// ----- Helpers -----

/** Agrupa entries por dia (chave = 'YYYY-MM-DD' do start_time) */
export function groupEntriesByDay(entries: TimeEntryWithDetails[]): GroupedEntries {
  const grouped: GroupedEntries = {}
  for (const entry of entries) {
    const day = entry.start_time.slice(0, 10) // 'YYYY-MM-DD'
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(entry)
  }
  return grouped
}

type UseWorkReturn = {
  tasks: TaskWithCategory[]
  timeEntries: TimeEntryWithDetails[]
  groupedEntries: GroupedEntries
  isLoadingTasks: boolean
  isLoadingEntries: boolean
  isUpdating: boolean
  refetchTasks: () => void
  refetchEntries: () => void
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
}

// ----- Hook -----

export function useWork(): UseWorkReturn {
  const { user } = useAuth()

  const [tasks, setTasks] = useState<TaskWithCategory[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithDetails[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [tasksTick, setTasksTick] = useState(0)
  const [entriesTick, setEntriesTick] = useState(0)

  const refetchTasks = () => setTasksTick((t) => t + 1)
  const refetchEntries = () => setEntriesTick((t) => t + 1)

  // ----- Fetch tasks (WORK categories) -----
  useEffect(() => {
    if (!user) {
      setTasks([])
      setIsLoadingTasks(false)
      return
    }

    setIsLoadingTasks(true)

    supabase
      .from('tasks')
      .select('*, categories!inner(name, color_hex)')
      .eq('user_id', user.id)
      .eq('categories.type', 'WORK')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('[useWork] Erro ao buscar tarefas:', error.message)
        }
        setTasks((data as TaskWithCategory[]) ?? [])
        setIsLoadingTasks(false)
      })
  }, [user, tasksTick])

  // ----- Fetch time_entries (WORK, últimas 50, com pausas) -----
  useEffect(() => {
    if (!user) {
      setTimeEntries([])
      setIsLoadingEntries(false)
      return
    }

    setIsLoadingEntries(true)

    supabase
      .from('time_entries')
      .select('*, categories(name, color_hex), tasks(title), pauses(*)')
      .eq('user_id', user.id)
      .eq('session_type', 'WORK')
      .order('start_time', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error('[useWork] Erro ao buscar time_entries:', error.message)
        }
        setTimeEntries((data as TimeEntryWithDetails[]) ?? [])
        setIsLoadingEntries(false)
      })
  }, [user, entriesTick])

  // Agrupamento memoizado
  const groupedEntries = useMemo(() => groupEntriesByDay(timeEntries), [timeEntries])

  // ----- Atualizar status da tarefa (Kanban) -----
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setIsUpdating(true)

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId)

    if (error) {
      console.error('[useWork] Erro ao atualizar status:', error.message)
    }

    setIsUpdating(false)
    refetchTasks()
  }

  return {
    tasks,
    timeEntries,
    groupedEntries,
    isLoadingTasks,
    isLoadingEntries,
    isUpdating,
    refetchTasks,
    refetchEntries,
    updateTaskStatus,
  }
}
