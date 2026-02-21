import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { SessionType } from '@/types'

// ----- Tipos -----

export type TimerMode = 'free' | 'pomodoro'
type TimerStatus = 'idle' | 'running' | 'paused'

/** Duração padrão do pomodoro: 25 min */
export const DEFAULT_POMODORO_SECONDS = 25 * 60

interface UseTimerReturn {
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

// ----- Hook -----

export function useTimer(): UseTimerReturn {
  const { user } = useAuth()

  const [elapsedTime, setElapsedTime] = useState(0)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [mode, setMode] = useState<TimerMode>('free')
  const [pomodoroDuration, setPomodoroDuration] = useState(DEFAULT_POMODORO_SECONDS)

  // Referências para o intervalo e para calcular pausas
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activePauseIdRef = useRef<string | null>(null)
  // Acumulador de segundos pausados na sessão atual
  const pausedSecondsRef = useRef(0)
  const sessionStartRef = useRef<Date | null>(null)
  // Evita restaurar duas vezes
  const restoredRef = useRef(false)
  // Ref para o modo/duração correntes (evita stale closures no interval)
  const modeRef = useRef<TimerMode>(mode)
  const pomoDurationRef = useRef(pomodoroDuration)

  // Manter refs sincronizadas
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { pomoDurationRef.current = pomodoroDuration }, [pomodoroDuration])

  // Remaining time calculado
  const remainingTime =
    mode === 'pomodoro' ? Math.max(0, pomodoroDuration - elapsedTime) : 0

  // ----- Tick do cronômetro -----

  // Ref para chamar stopTimer de dentro do interval sem stale closure
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

      // 2. Buscar todas as pausas FECHADAS dessa sessão para calcular tempo pausado
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

      // 3. Verificar se existe uma pausa ABERTA (end_time IS NULL)
      const { data: openPause } = await supabase
        .from('pauses')
        .select('id, start_time')
        .eq('time_entry_id', entry.id)
        .is('end_time', null)
        .limit(1)
        .maybeSingle()

      // 4. Restaurar estado
      const sessionStart = new Date(entry.start_time)
      sessionStartRef.current = sessionStart
      pausedSecondsRef.current = totalPausedSeconds
      setActiveEntryId(entry.id)

      if (openPause) {
        // Acumular tempo da pausa aberta até agora para o elapsed ficar correto
        const pauseOngoing = Math.floor(
          (Date.now() - new Date(openPause.start_time).getTime()) / 1000,
        )
        pausedSecondsRef.current += pauseOngoing
        activePauseIdRef.current = openPause.id

        const totalElapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000)
        setElapsedTime(Math.max(0, totalElapsed - pausedSecondsRef.current))
        setStatus('paused')
      } else {
        const totalElapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000)
        setElapsedTime(Math.max(0, totalElapsed - totalPausedSeconds))
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
        console.error('[useTimer] Erro ao criar time_entry:', error.message)
        return
      }

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
        console.error('[useTimer] Erro ao criar pausa:', error.message)
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
      console.error('[useTimer] Erro ao fechar pausa:', error.message)
      return
    }

    // Acumular tempo pausado
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

    // Se estava pausado, fechar a pausa aberta primeiro
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
      console.error('[useTimer] Erro ao finalizar time_entry:', error.message)
      return
    }

    setActiveEntryId(null)
    setElapsedTime(0)
    pausedSecondsRef.current = 0
    sessionStartRef.current = null
    setStatus('idle')
  }, [activeEntryId, elapsedTime, stopTicking])

  // Manter ref sincronizada para o auto-stop do pomodoro
  useEffect(() => { stopTimerRef.current = stopTimer }, [stopTimer])

  return {
    elapsedTime,
    remainingTime,
    mode,
    setMode: (m: TimerMode) => {
      // Só permite trocar modo quando idle
      if (status === 'idle') setMode(m)
    },
    pomodoroDuration,
    setPomodoroDuration: (s: number) => {
      if (status === 'idle') setPomodoroDuration(s)
    },
    status,
    isRunning: status === 'running',
    isPaused: status === 'paused',
    activeEntryId,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
  }
}
