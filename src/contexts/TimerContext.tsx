// ==========================================
// ChronosFlow - Timer Context (Global + Persistente)
// ==========================================
// Toda a lógica do timer vive aqui como Context para:
// 1. Sobreviver à navegação entre páginas (SPA)
// 2. Persistir modo pomodoro/duração no localStorage
// 3. Restaurar estado correto ao recarregar (F5)

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { SessionType } from '@/types'

// ----- Tipos -----

export type TimerMode = 'free' | 'pomodoro'
type TimerStatus = 'idle' | 'running' | 'paused'

/** Duração padrão do pomodoro: 25 min */
export const DEFAULT_POMODORO_SECONDS = 25 * 60

/** Chave usada no localStorage para persistir config do timer */
const STORAGE_KEY = '@chronos:timer_config'

interface TimerConfig {
  mode: TimerMode
  pomodoroDuration: number
}

interface TimerContextValue {
  /** Segundos decorridos */
  elapsedTime: number
  /** Tempo restante (pomodoro) — 0 no modo livre */
  remainingTime: number
  /** Modo atual */
  mode: TimerMode
  setMode: (m: TimerMode) => void
  /** Duração do pomodoro em segundos */
  pomodoroDuration: number
  setPomodoroDuration: (s: number) => void
  /** Status legível */
  status: TimerStatus
  isRunning: boolean
  isPaused: boolean
  /** UUID da time_entry ativa no Supabase */
  activeEntryId: string | null
  /** Inicia uma nova sessão */
  startTimer: (sessionType?: SessionType, taskId?: string, categoryId?: string) => Promise<void>
  /** Pausa a sessão atual (cria registro de pause) */
  pauseTimer: (reason?: string) => Promise<void>
  /** Retoma a sessão (fecha a pause aberta) */
  resumeTimer: () => Promise<void>
  /** Para a sessão e grava duração total */
  stopTimer: () => Promise<void>
}

const TimerContext = createContext<TimerContextValue | null>(null)

// ----- Helpers de localStorage -----

function saveTimerConfig(config: TimerConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage indisponível — silenciar
  }
}

function loadTimerConfig(): TimerConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimerConfig
  } catch {
    return null
  }
}

function clearTimerConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // silenciar
  }
}

// ----- Provider -----

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const [elapsedTime, setElapsedTime] = useState(0)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [mode, setModeState] = useState<TimerMode>('free')
  const [pomodoroDuration, setPomodoroDurationState] = useState(DEFAULT_POMODORO_SECONDS)

  // Referências para o intervalo e para calcular pausas
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activePauseIdRef = useRef<string | null>(null)
  const pausedSecondsRef = useRef(0)
  const sessionStartRef = useRef<Date | null>(null)
  const restoredRef = useRef(false)

  // Refs para evitar stale closures no setInterval
  const modeRef = useRef<TimerMode>(mode)
  const pomoDurationRef = useRef(pomodoroDuration)

  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { pomoDurationRef.current = pomodoroDuration }, [pomodoroDuration])

  // Remaining time calculado
  const remainingTime =
    mode === 'pomodoro' ? Math.max(0, pomodoroDuration - elapsedTime) : 0

  // ----- Tick do cronômetro -----

  const stopTimerRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const startTicking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (!sessionStartRef.current) return
      const now = Date.now()
      const totalElapsed = Math.floor((now - sessionStartRef.current.getTime()) / 1000)
      const effective = Math.max(0, totalElapsed - pausedSecondsRef.current)

      // Pomodoro auto-stop
      if (modeRef.current === 'pomodoro' && effective >= pomoDurationRef.current) {
        setElapsedTime(pomoDurationRef.current)
        stopTimerRef.current()
        return
      }

      setElapsedTime(effective)
    }, 1000)
  }, [])

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => stopTicking()
  }, [stopTicking])

  // ----- Restaurar sessão ativa no mount / reload -----

  useEffect(() => {
    if (!user || restoredRef.current) return
    restoredRef.current = true

    const restoreSession = async () => {
      // 1. Buscar time_entry ativa (end_time IS NULL)
      const { data: entry, error: entryErr } = await supabase
        .from('time_entries')
        .select('id, start_time')
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (entryErr || !entry) return

      // 2. Restaurar modo a partir do localStorage
      const savedConfig = loadTimerConfig()
      if (savedConfig) {
        setModeState(savedConfig.mode)
        modeRef.current = savedConfig.mode
        setPomodoroDurationState(savedConfig.pomodoroDuration)
        pomoDurationRef.current = savedConfig.pomodoroDuration
      }

      // 3. Buscar todas as pausas FECHADAS dessa sessão para calcular tempo pausado
      const { data: closedPauses } = await supabase
        .from('pauses')
        .select('start_time, end_time')
        .eq('time_entry_id', entry.id)
        .not('end_time', 'is', null)

      let totalPausedSeconds = 0
      for (const p of closedPauses ?? []) {
        if (p.start_time && p.end_time) {
          totalPausedSeconds += Math.floor(
            (new Date(p.end_time).getTime() - new Date(p.start_time).getTime()) / 1000,
          )
        }
      }

      // 4. Verificar se existe uma pausa ABERTA (end_time IS NULL)
      const { data: openPause } = await supabase
        .from('pauses')
        .select('id, start_time')
        .eq('time_entry_id', entry.id)
        .is('end_time', null)
        .limit(1)
        .maybeSingle()

      // 5. Restaurar estado
      const sessionStart = new Date(entry.start_time)
      sessionStartRef.current = sessionStart
      pausedSecondsRef.current = totalPausedSeconds
      setActiveEntryId(entry.id)

      if (openPause) {
        const pauseOngoing = Math.floor(
          (Date.now() - new Date(openPause.start_time).getTime()) / 1000,
        )
        pausedSecondsRef.current += pauseOngoing
        activePauseIdRef.current = openPause.id

        const totalElapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000)
        const effective = Math.max(0, totalElapsed - pausedSecondsRef.current)

        // No modo pomodoro, limitar ao máximo da duração
        if (savedConfig?.mode === 'pomodoro' && effective >= savedConfig.pomodoroDuration) {
          setElapsedTime(savedConfig.pomodoroDuration)
        } else {
          setElapsedTime(effective)
        }

        setStatus('paused')
      } else {
        const totalElapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000)
        const effective = Math.max(0, totalElapsed - totalPausedSeconds)

        // No modo pomodoro, se já excedeu, auto-stop
        if (savedConfig?.mode === 'pomodoro' && effective >= savedConfig.pomodoroDuration) {
          setElapsedTime(savedConfig.pomodoroDuration)
          // Finalizar sessão automaticamente
          const now = new Date().toISOString()
          await supabase
            .from('time_entries')
            .update({
              end_time: now,
              total_duration: savedConfig.pomodoroDuration,
            })
            .eq('id', entry.id)
          clearTimerConfig()
          setActiveEntryId(null)
          setStatus('idle')
          return
        }

        setElapsedTime(effective)
        setStatus('running')
        startTicking()
      }
    }

    restoreSession()
  }, [user, startTicking])

  // ----- Ações -----

  const startTimer = useCallback(
    async (sessionType: SessionType = 'WORK', taskId?: string, categoryId?: string) => {
      if (!user) return

      const { data, error } = await supabase
        .from('time_entries')
        .insert([
          {
            user_id: user.id,
            session_type: sessionType,
            task_id: taskId ?? null,
            category_id: categoryId ?? null,
          },
        ])
        .select('id')
        .single()

      if (error) {
        console.error('[TimerContext] Erro ao criar time_entry:', error.message)
        return
      }

      // Persistir config no localStorage
      saveTimerConfig({ mode: modeRef.current, pomodoroDuration: pomoDurationRef.current })

      setActiveEntryId(data.id)
      setElapsedTime(0)
      pausedSecondsRef.current = 0
      sessionStartRef.current = new Date()
      setStatus('running')
      startTicking()
    },
    [user, startTicking],
  )

  const pauseTimer = useCallback(
    async (reason?: string) => {
      if (!user || !activeEntryId) return

      const { data, error } = await supabase
        .from('pauses')
        .insert([
          {
            user_id: user.id,
            time_entry_id: activeEntryId,
            reason: reason ?? null,
          },
        ])
        .select('id, start_time')
        .single()

      if (error) {
        console.error('[TimerContext] Erro ao criar pausa:', error.message)
        return
      }

      activePauseIdRef.current = data.id
      stopTicking()
      setStatus('paused')
    },
    [user, activeEntryId, stopTicking],
  )

  const resumeTimer = useCallback(async () => {
    if (!activePauseIdRef.current) return

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('pauses')
      .update({ end_time: now })
      .eq('id', activePauseIdRef.current)
      .select('start_time, end_time')
      .single()

    if (error) {
      console.error('[TimerContext] Erro ao fechar pausa:', error.message)
      return
    }

    if (data.start_time && data.end_time) {
      const pauseDuration = Math.floor(
        (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / 1000,
      )
      pausedSecondsRef.current += pauseDuration
    }

    activePauseIdRef.current = null
    setStatus('running')
    startTicking()
  }, [startTicking])

  const stopTimer = useCallback(async () => {
    if (!activeEntryId) return

    stopTicking()

    const now = new Date().toISOString()

    if (activePauseIdRef.current) {
      await supabase
        .from('pauses')
        .update({ end_time: now })
        .eq('id', activePauseIdRef.current)

      activePauseIdRef.current = null
    }

    const { error } = await supabase
      .from('time_entries')
      .update({
        end_time: now,
        total_duration: elapsedTime,
      })
      .eq('id', activeEntryId)

    if (error) {
      console.error('[TimerContext] Erro ao finalizar time_entry:', error.message)
      return
    }

    // Limpar localStorage
    clearTimerConfig()

    setActiveEntryId(null)
    setElapsedTime(0)
    pausedSecondsRef.current = 0
    sessionStartRef.current = null
    setStatus('idle')
  }, [activeEntryId, elapsedTime, stopTicking])

  // Manter ref sincronizada para o auto-stop do pomodoro
  useEffect(() => { stopTimerRef.current = stopTimer }, [stopTimer])

  // ----- Setters protegidos (só quando idle) -----

  const setMode = useCallback((m: TimerMode) => {
    if (status !== 'idle') return
    setModeState(m)
  }, [status])

  const setPomodoroDuration = useCallback((s: number) => {
    if (status !== 'idle') return
    setPomodoroDurationState(s)
  }, [status])

  // ----- Valor do contexto -----

  const value: TimerContextValue = {
    elapsedTime,
    remainingTime,
    mode,
    setMode,
    pomodoroDuration,
    setPomodoroDuration,
    status,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    activeEntryId,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

// ----- Hook de consumo -----

export function useTimerContext(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) {
    throw new Error('useTimerContext deve ser usado dentro de <TimerProvider>')
  }
  return ctx
}
