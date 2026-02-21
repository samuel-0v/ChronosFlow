// ==========================================
// ChronosFlow - Supabase Client
// ==========================================
// Inicializa e exporta o cliente Supabase tipado.
// As variáveis de ambiente são injetadas pelo Vite em build time.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. ' +
    'Crie um arquivo .env.local na raiz do projeto com essas variáveis.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
