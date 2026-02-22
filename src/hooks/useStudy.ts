// ==========================================
// ChronosFlow - useStudy Hook
// ==========================================
// Busca study_notes (recentes) e flashcards (próximos a revisar).

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { StudyNote, Flashcard, Category } from '@/types'

// ----- Tipos auxiliares -----

export type StudyNoteWithCategory = StudyNote & {
  categories: Pick<Category, 'name' | 'color_hex'> | null
}

export type FlashcardWithCategory = Flashcard & {
  categories: Pick<Category, 'name' | 'color_hex'> | null
}

interface UseStudyReturn {
  notes: StudyNoteWithCategory[]
  flashcards: FlashcardWithCategory[]
  isLoadingNotes: boolean
  isLoadingFlashcards: boolean
  isReviewing: boolean
  refetchNotes: () => void
  refetchFlashcards: () => void
  reviewFlashcard: (cardId: string, grade: number) => Promise<void>
}

// ----- Hook -----

export function useStudy(): UseStudyReturn {
  const { user } = useAuth()

  const [notes, setNotes] = useState<StudyNoteWithCategory[]>([])
  const [flashcards, setFlashcards] = useState<FlashcardWithCategory[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(true)
  const [isReviewing, setIsReviewing] = useState(false)
  const [notesTick, setNotesTick] = useState(0)
  const [flashcardsTick, setFlashcardsTick] = useState(0)

  const refetchNotes = () => setNotesTick((t) => t + 1)
  const refetchFlashcards = () => setFlashcardsTick((t) => t + 1)

  // ----- Fetch notes -----
  useEffect(() => {
    if (!user) {
      setNotes([])
      setIsLoadingNotes(false)
      return
    }

    setIsLoadingNotes(true)

    supabase
      .from('study_notes')
      .select('*, categories(name, color_hex)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error('[useStudy] Erro ao buscar notas:', error.message)
        }
        setNotes((data as StudyNoteWithCategory[]) ?? [])
        setIsLoadingNotes(false)
      })
  }, [user, notesTick])

  // ----- Fetch flashcards -----
  useEffect(() => {
    if (!user) {
      setFlashcards([])
      setIsLoadingFlashcards(false)
      return
    }

    setIsLoadingFlashcards(true)

    supabase
      .from('flashcards')
      .select('*, categories(name, color_hex)')
      .eq('user_id', user.id)
      .order('next_review', { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('[useStudy] Erro ao buscar flashcards:', error.message)
        }
        setFlashcards((data as FlashcardWithCategory[]) ?? [])
        setIsLoadingFlashcards(false)
      })
  }, [user, flashcardsTick])

  // ----- SM-2 Spaced Repetition -----
  const reviewFlashcard = async (cardId: string, grade: number) => {
    const card = flashcards.find((fc) => fc.id === cardId)
    if (!card) return

    setIsReviewing(true)

    const oldInterval = card.interval_days
    const oldEase = card.ease_factor

    let newInterval: number
    let newEase: number

    if (grade === 0) {
      // Errou — reinicia intervalo
      newInterval = 1
      newEase = Math.max(1.3, oldEase - 0.2)
    } else {
      // Ajuste do ease_factor pelo SM-2
      newEase = Math.max(
        1.3,
        oldEase + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)),
      )
      newInterval = oldInterval === 0 ? 1 : Math.round(oldInterval * newEase)
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + newInterval)

    const { error } = await supabase
      .from('flashcards')
      .update({
        interval_days: newInterval,
        ease_factor: newEase,
        next_review: nextReview.toISOString(),
      })
      .eq('id', cardId)

    if (error) {
      console.error('[useStudy] Erro ao revisar flashcard:', error.message)
    }

    setIsReviewing(false)
    refetchFlashcards()
  }

  return {
    notes,
    flashcards,
    isLoadingNotes,
    isLoadingFlashcards,
    isReviewing,
    refetchNotes,
    refetchFlashcards,
    reviewFlashcard,
  }
}
