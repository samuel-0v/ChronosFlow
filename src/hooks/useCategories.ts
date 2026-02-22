import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Category } from '@/types'

// ----- Tipo enriquecido -----

export type CategoryWithMetrics = Category & {
  /** Soma de total_duration (segundos) de todas as sessões */
  totalTimeSeconds: number
  /** Tarefas com status PENDING ou IN_PROGRESS */
  pendingTasks: number
  /** Tarefas com status COMPLETED */
  completedTasks: number
  /** Timestamp da sessão mais recente, ou null */
  lastActivity: string | null
}

interface UseCategoriesReturn {
  categories: CategoryWithMetrics[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCategories(): UseCategoriesReturn {
  const { user } = useAuth()
  const [rawCategories, setRawCategories] = useState<Category[]>([])
  const [taskRows, setTaskRows] = useState<
    Array<{ category_id: string | null; status: string }>
  >([])
  const [entryRows, setEntryRows] = useState<
    Array<{ category_id: string | null; total_duration: number | null; start_time: string }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = () => setTick((t) => t + 1)

  useEffect(() => {
    if (!user) {
      setRawCategories([])
      setTaskRows([])
      setEntryRows([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const catPromise = supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    const taskPromise = supabase
      .from('tasks')
      .select('category_id, status')
      .eq('user_id', user.id)

    const entryPromise = supabase
      .from('time_entries')
      .select('category_id, total_duration, start_time')
      .eq('user_id', user.id)
      .not('total_duration', 'is', null)

    Promise.all([catPromise, taskPromise, entryPromise]).then(
      ([catRes, taskRes, entryRes]) => {
        if (catRes.error) {
          console.error('[useCategories] Erro categorias:', catRes.error.message)
          setError(catRes.error.message)
        }
        if (taskRes.error) {
          console.error('[useCategories] Erro tasks:', taskRes.error.message)
        }
        if (entryRes.error) {
          console.error('[useCategories] Erro entries:', entryRes.error.message)
        }

        setRawCategories((catRes.data as Category[]) ?? [])
        setTaskRows(
          (taskRes.data as Array<{ category_id: string | null; status: string }>) ?? [],
        )
        setEntryRows(
          (entryRes.data as Array<{
            category_id: string | null
            total_duration: number | null
            start_time: string
          }>) ?? [],
        )
        setIsLoading(false)
      },
    )
  }, [user, tick])

  // ----- Enriquecer categorias com métricas -----
  const categories = useMemo<CategoryWithMetrics[]>(() => {
    return rawCategories.map((cat) => {
      // Tasks
      let pendingTasks = 0
      let completedTasks = 0
      for (const t of taskRows) {
        if (t.category_id !== cat.id) continue
        if (t.status === 'COMPLETED') completedTasks++
        else pendingTasks++
      }

      // Time entries
      let totalTimeSeconds = 0
      let lastActivity: string | null = null
      for (const e of entryRows) {
        if (e.category_id !== cat.id) continue
        totalTimeSeconds += e.total_duration ?? 0
        if (!lastActivity || e.start_time > lastActivity) {
          lastActivity = e.start_time
        }
      }

      return {
        ...cat,
        totalTimeSeconds,
        pendingTasks,
        completedTasks,
        lastActivity,
      }
    })
  }, [rawCategories, taskRows, entryRows])

  return { categories, isLoading, error, refetch }
}
