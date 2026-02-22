// ==========================================
// ChronosFlow - useStats Hook
// ==========================================
// Busca metas do perfil, totais semanais (WORK / STUDY)
// e breakdown de hoje por categoria.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { localMidnightISO } from '@/lib/formatTime'

// ----- Helpers de data (sem dependência externa) -----

/** Retorna segunda-feira 00:00 da semana atual */
function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay() // 0 = dom, 1 = seg …
  const diff = day === 0 ? 6 : day - 1 // distância até segunda
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

/** Retorna domingo 23:59:59.999 da semana atual */
function getWeekEnd(): Date {
  const monday = getWeekStart()
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

// ----- Tipos de retorno -----

export interface CategoryBreakdown {
  categoryId: string | null
  categoryName: string
  colorHex: string
  totalSeconds: number
}

export interface UseStatsReturn {
  /** Meta semanal de trabalho (horas) */
  workGoalHours: number
  /** Meta semanal de estudo (horas) */
  studyGoalHours: number
  /** Segundos trabalhados na semana */
  weekWorkSeconds: number
  /** Segundos estudados na semana */
  weekStudySeconds: number
  /** % de conclusão da meta de trabalho (0-100+) */
  workPercent: number
  /** % de conclusão da meta de estudo (0-100+) */
  studyPercent: number
  /** Total de segundos logados hoje */
  todayTotalSeconds: number
  /** Breakdown de hoje por categoria */
  todayByCategory: CategoryBreakdown[]
  /** Carregando dados */
  isLoading: boolean
  /** Recarregar tudo */
  refetch: () => void
}

// ----- Hook -----

export function useStats(): UseStatsReturn {
  const { user } = useAuth()

  const [workGoalHours, setWorkGoalHours] = useState(0)
  const [studyGoalHours, setStudyGoalHours] = useState(0)
  const [weekWorkSeconds, setWeekWorkSeconds] = useState(0)
  const [weekStudySeconds, setWeekStudySeconds] = useState(0)
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(0)
  const [todayByCategory, setTodayByCategory] = useState<CategoryBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const hasFetched = useRef(false)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    // Só mostra loading no primeiro fetch; depois faz refetch silencioso
    if (!hasFetched.current) setIsLoading(true)

    const weekStart = getWeekStart().toISOString()
    const weekEnd = getWeekEnd().toISOString()
    const todayStart = localMidnightISO()

    // Executar as 3 queries em paralelo
    const profilePromise = supabase
      .from('profiles')
      .select('work_goal_hours, study_goal_hours')
      .eq('id', user.id)
      .single()

    const weekPromise = supabase
      .from('time_entries')
      .select('session_type, total_duration')
      .eq('user_id', user.id)
      .gte('start_time', weekStart)
      .lte('start_time', weekEnd)
      .not('total_duration', 'is', null)

    const todayPromise = supabase
      .from('time_entries')
      .select('category_id, total_duration, categories(name, color_hex)')
      .eq('user_id', user.id)
      .gte('start_time', todayStart)
      .not('total_duration', 'is', null)

    Promise.all([profilePromise, weekPromise, todayPromise]).then(
      ([profileRes, weekRes, todayRes]) => {
        // --- Perfil ---
        if (!profileRes.error && profileRes.data) {
          setWorkGoalHours(profileRes.data.work_goal_hours ?? 0)
          setStudyGoalHours(profileRes.data.study_goal_hours ?? 0)
        }

        // --- Semana ---
        if (!weekRes.error && weekRes.data) {
          const entries = weekRes.data as Array<{
            session_type: string
            total_duration: number | null
          }>
          let work = 0
          let study = 0
          for (const e of entries) {
            const dur = e.total_duration ?? 0
            if (e.session_type === 'WORK') work += dur
            else if (e.session_type === 'STUDY') study += dur
          }
          setWeekWorkSeconds(work)
          setWeekStudySeconds(study)
        }

        // --- Hoje por categoria ---
        if (!todayRes.error && todayRes.data) {
          const raw = todayRes.data as Array<{
            category_id: string | null
            total_duration: number | null
            categories: { name: string; color_hex: string } | null
          }>

          // Agrupar por category_id
          const map = new Map<
            string,
            { name: string; colorHex: string; total: number }
          >()
          let totalToday = 0

          for (const r of raw) {
            const dur = r.total_duration ?? 0
            totalToday += dur

            const key = r.category_id ?? '__none__'
            const existing = map.get(key)

            if (existing) {
              existing.total += dur
            } else {
              map.set(key, {
                name: r.categories?.name ?? 'Sem categoria',
                colorHex: r.categories?.color_hex ?? '#64748b',
                total: dur,
              })
            }
          }

          setTodayTotalSeconds(totalToday)

          const breakdown: CategoryBreakdown[] = Array.from(map.entries())
            .map(([key, v]) => ({
              categoryId: key === '__none__' ? null : key,
              categoryName: v.name,
              colorHex: v.colorHex,
              totalSeconds: v.total,
            }))
            .sort((a, b) => b.totalSeconds - a.totalSeconds)

          setTodayByCategory(breakdown)
        }

        setIsLoading(false)
        hasFetched.current = true
      },
    )
  }, [user, tick])

  // Porcentagens
  const workGoalSeconds = workGoalHours * 3600
  const studyGoalSeconds = studyGoalHours * 3600

  const workPercent =
    workGoalSeconds > 0 ? Math.round((weekWorkSeconds / workGoalSeconds) * 100) : 0
  const studyPercent =
    studyGoalSeconds > 0 ? Math.round((weekStudySeconds / studyGoalSeconds) * 100) : 0

  return {
    workGoalHours,
    studyGoalHours,
    weekWorkSeconds,
    weekStudySeconds,
    workPercent,
    studyPercent,
    todayTotalSeconds,
    todayByCategory,
    isLoading,
    refetch,
  }
}
