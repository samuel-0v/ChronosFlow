// ==========================================
// ChronosFlow - useProfile Hook
// ==========================================
// Busca e atualiza o perfil do utilizador (profiles table).

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Profile, ProfileUpdate } from '@/types'

export interface UseProfileReturn {
  profile: Profile | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  refetch: () => void
  updateProfile: (data: ProfileUpdate) => Promise<boolean>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  // ----- Fetch profile -----
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          console.error('[useProfile] Erro ao buscar perfil:', fetchError.message)
          setError('Erro ao carregar perfil.')
        }
        setProfile((data as Profile) ?? null)
        setIsLoading(false)
      })
  }, [user, tick])

  // ----- Update profile -----
  const updateProfile = useCallback(
    async (data: ProfileUpdate): Promise<boolean> => {
      if (!user) return false

      setIsSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)

      setIsSaving(false)

      if (updateError) {
        console.error('[useProfile] Erro ao atualizar perfil:', updateError.message)
        setError('Erro ao salvar perfil. Tente novamente.')
        return false
      }

      refetch()
      return true
    },
    [user, refetch],
  )

  return {
    profile,
    isLoading,
    isSaving,
    error,
    refetch,
    updateProfile,
  }
}
