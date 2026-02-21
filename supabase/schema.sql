-- 1. Habilitar a extensão UUID (geralmente já vem ativada no Supabase, mas é boa prática garantir)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CRIAÇÃO DAS TABELAS
-- ==========================================

-- Tabela: profiles (Estende a tabela de autenticação do Supabase)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    work_goal_hours INTEGER DEFAULT 30,
    study_goal_hours INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: categories (Contextos como Matérias da faculdade ou Projetos de trabalho)
CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('WORK', 'STUDY', 'PERSONAL')) NOT NULL,
    color_hex TEXT DEFAULT '#3B82F6', -- Azul por padrão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: tasks (O quadro ágil e lista de afazeres)
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    priority INTEGER CHECK (priority >= 1 AND priority <= 4) DEFAULT 3, -- 1: Urgente, 2: Alta, 3: Média, 4: Baixa
    status TEXT CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
    due_date DATE,
    estimated_time INTEGER, -- Tempo em minutos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: time_entries (O registro do tempo)
CREATE TABLE public.time_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    session_type TEXT CHECK (session_type IN ('WORK', 'STUDY')) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE, -- Fica nulo até o usuário clicar em "Stop"
    total_duration INTEGER, -- Segundos totais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: pauses (O registro de interrupções)
-- Adicionado o user_id aqui também para facilitar a segurança (RLS) depois
CREATE TABLE public.pauses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: study_notes (Brain Dump & Links anexados)
CREATE TABLE public.study_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    note_type TEXT CHECK (note_type IN ('LINK', 'BRAIN_DUMP')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela: flashcards (Repetição Espaçada)
CREATE TABLE public.flashcards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    front_question TEXT NOT NULL,
    back_answer TEXT NOT NULL,
    next_review DATE NOT NULL DEFAULT CURRENT_DATE,
    interval_days INTEGER DEFAULT 0,
    ease_factor NUMERIC DEFAULT 2.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- CONFIGURAÇÃO DE SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- ==========================================
-- Isso garante que um usuário só consegue ver, editar e deletar os próprios dados.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso total para o dono dos dados (O usuário logado)
CREATE POLICY "Acesso total aos proprios perfis" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Acesso total as proprias categorias" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso total as proprias tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso total as proprias time_entries" ON public.time_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso total as proprias pauses" ON public.pauses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso total as proprias study_notes" ON public.study_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Acesso total aos proprios flashcards" ON public.flashcards FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGER DE AUTOCRIAÇÃO DE PERFIL
-- ==========================================
-- Cria automaticamente um registro na tabela 'profiles' quando um usuário faz o cadastro no Supabase Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();