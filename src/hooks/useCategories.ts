import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Category } from '@/types'

interface UseCategoriesReturn {
  categories: Category[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useCategories(): UseCategoriesReturn {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = () => setTick((t) => t + 1)

  useEffect(() => {
    if (!user) {
      setCategories([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })
      .then(({ data, error: err }) => {
        if (err) {
          console.error('[useCategories] Erro:', err.message)
          setError(err.message)
        }
        setCategories((data as Category[]) ?? [])
        setIsLoading(false)
      })
  }, [user, tick])

  return { categories, isLoading, error, refetch }
}
