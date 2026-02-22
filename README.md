# 🚀 ChronosFlow

O **ChronosFlow** é um ecossistema de produtividade pessoal desenvolvido para otimizar a gestão de tempo e o foco. O projeto combina um gerenciador de tarefas inteligente com ferramentas de rastreamento de tempo (Time Tracking), pomodoro e flashcards para estudo, tudo operando sob uma arquitetura moderna de **PWA (Progressive Web App)**.

## 🎯 Funcionalidades Principais

* **⏱️ Timer Dual:** Alternância inteligente entre Cronômetro Livre e Pomodoro, com integração direta ao registro de horas (Timesheet).
* **📋 Gestão de Tarefas:** Sistema de tarefas com priorização e filtros por categoria (Estudo/Trabalho).
* **🃏 Flashcards:** Sistema de repetição espaçada para memorização (ideal para aprendizado de idiomas).
* **📊 Dashboards Dinâmicos:** Visualização de estatísticas diárias e semanais de produtividade.
* **📱 PWA Nativo:** Instalável em dispositivos Android/iOS com suporte offline e carregamento instantâneo.
* **⚡ Optimistic UI:** Experiência de uso fluida onde as atualizações refletem na interface antes mesmo da confirmação do servidor.

## 🛠️ Tech Stack

* **Frontend:** React 18 + TypeScript + Vite.
* **Estilização:** Tailwind CSS (com suporte a temas escuros e animações de glow).
* **Backend/Auth:** Supabase (PostgreSQL + Auth + Edge Functions).
* **PWA:** `vite-plugin-pwa` para Service Workers e Manifesto.
* **Ícones:** Lucide React.

## 📦 Instalação e Execução

1. **Clone o repositório:**
```bash
git clone https://github.com/Samuel-Victor-Alventino-Silva/ChronosFlow.git

```


2. **Instale as dependências:**
```bash
npm install

```


3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz e adicione suas chaves do Supabase:
```env
VITE_SUPABASE_URL=seu_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui

```


4. **Execute o projeto:**
```bash
npm run dev

```



## 🔒 Segurança & Database

O projeto segue as melhores práticas de banco de dados PostgreSQL no Supabase, incluindo:

* **RLS (Row Level Security):** Seus dados são protegidos e acessíveis apenas por você.
* **Triggers:** Automação para criação de perfis de usuário via `handle_new_user`.
* **Search Path Security:** Funções de banco protegidas contra ataques de injeção.

## 👤 Autor

**Samuel Victor Alventino Silva** *Estudante de Sistemas de Informação - UFU*