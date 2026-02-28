-- ==============================================================================
-- CHRONOSFLOW - MÓDULO FINANCEIRO (SUPER APP)
-- Banco de Dados: Supabase (PostgreSQL)
-- ==============================================================================

-- 1. TABELA DE CATEGORIAS
-- Usada para classificar receitas e despesas (Ex: Alimentação, Transporte, Salário)
CREATE TABLE public.finance_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    color_hex TEXT DEFAULT '#94a3b8',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE CONTAS E BANCOS
-- type: 'CHECKING' (Corrente/Pix/Débito), 'CREDIT' (Cartão de Crédito), 'CASH' (Dinheiro Físico)
CREATE TABLE public.finance_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CHECKING', 'CREDIT', 'CASH')),
    balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    invested_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    closing_day INTEGER, -- Apenas para cartões de crédito (1 a 31)
    due_day INTEGER,     -- Apenas para cartões de crédito (1 a 31)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE FATURAS (Apenas para contas do tipo 'CREDIT')
-- Agrupa as transações de um cartão em um mês/ano específico.
CREATE TABLE public.finance_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED', 'PAID')),
    total_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(account_id, month, year) -- Garante apenas 1 fatura por mês para cada cartão
);

-- 4. TABELA DE TRANSAÇÕES (O coração do sistema)
CREATE TABLE public.finance_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.finance_accounts(id) ON DELETE RESTRICT NOT NULL,
    destination_account_id UUID REFERENCES public.finance_accounts(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    bill_id UUID REFERENCES public.finance_bills(id) ON DELETE SET NULL,
    
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('PIX', 'DEBIT', 'CREDIT', 'CASH')),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    
    -- Lógica de Parcelamento
    is_installment BOOLEAN DEFAULT FALSE,
    installment_number INTEGER,
    total_installments INTEGER,
    parent_transaction_id UUID REFERENCES public.finance_transactions(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Garante que o usuário só veja e modifique seus próprios dados financeiros
-- ==============================================================================

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para Categories
CREATE POLICY "Users can manage their own categories" 
ON public.finance_categories FOR ALL USING (auth.uid() = user_id);

-- Políticas para Accounts
CREATE POLICY "Users can manage their own accounts" 
ON public.finance_accounts FOR ALL USING (auth.uid() = user_id);

-- Políticas para Bills
CREATE POLICY "Users can manage their own bills" 
ON public.finance_bills FOR ALL USING (auth.uid() = user_id);

-- Políticas para Transactions
CREATE POLICY "Users can manage their own transactions" 
ON public.finance_transactions FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGERS E FUNÇÕES AUTOMÁTICAS (A Mágica do Saldo)
-- ==============================================================================

-- Função para atualizar o saldo da conta automaticamente ao inserir/deletar transações
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Lógica para INSERT (Apenas transações pagas afetam o saldo da conta corrente)
    IF (TG_OP = 'INSERT' AND NEW.status = 'PAID') THEN
        
        -- Receita: Soma na conta
        IF (NEW.type = 'INCOME') THEN
            UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
        
        -- Despesa (Débito/Pix/Dinheiro): Subtrai da conta (Ignora crédito, pois crédito vai pra fatura)
        ELSIF (NEW.type = 'EXPENSE' AND NEW.payment_method != 'CREDIT') THEN
            UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            
        -- Transferência: Subtrai da origem, soma no destino
        ELSIF (NEW.type = 'TRANSFER') THEN
            UPDATE finance_accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
            IF (NEW.destination_account_id IS NOT NULL) THEN
                UPDATE finance_accounts SET balance = balance + NEW.amount WHERE id = NEW.destination_account_id;
            END IF;
        END IF;
    END IF;

    -- Lógica para DELETE (Estorna o valor)
    IF (TG_OP = 'DELETE' AND OLD.status = 'PAID') THEN
        IF (OLD.type = 'INCOME') THEN
            UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
        ELSIF (OLD.type = 'EXPENSE' AND OLD.payment_method != 'CREDIT') THEN
            UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
        ELSIF (OLD.type = 'TRANSFER') THEN
            UPDATE finance_accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
            IF (OLD.destination_account_id IS NOT NULL) THEN
                UPDATE finance_accounts SET balance = balance - OLD.amount WHERE id = OLD.destination_account_id;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

-- Aplica o gatilho na tabela de transações
CREATE TRIGGER trigger_update_balance
AFTER INSERT OR DELETE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Função para atualizar o total da fatura (Cartão de Crédito)
CREATE OR REPLACE FUNCTION update_bill_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Se inseriu uma despesa de crédito atrelada a uma fatura
    IF (TG_OP = 'INSERT' AND NEW.payment_method = 'CREDIT' AND NEW.bill_id IS NOT NULL) THEN
        UPDATE finance_bills SET total_amount = total_amount + NEW.amount WHERE id = NEW.bill_id;
    END IF;
    
    -- Se deletou uma despesa da fatura
    IF (TG_OP = 'DELETE' AND OLD.payment_method = 'CREDIT' AND OLD.bill_id IS NOT NULL) THEN
        UPDATE finance_bills SET total_amount = total_amount - OLD.amount WHERE id = OLD.bill_id;
    END IF;

    RETURN NULL;
END;
$$;

-- Aplica o gatilho nas faturas
CREATE TRIGGER trigger_update_bill
AFTER INSERT OR DELETE ON public.finance_transactions
FOR EACH ROW EXECUTE FUNCTION update_bill_total();