import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Briefcase, BookOpen, ListTodo, Tag, LogOut, User, Menu, X, Wallet } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'

// ----- Itens fixos da barra -----

interface MobileNavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const primaryItems: MobileNavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { to: '/work', label: 'Trabalho', icon: <Briefcase className="h-5 w-5" /> },
  { to: '/study', label: 'Estudos', icon: <BookOpen className="h-5 w-5" /> },
]

// ----- Itens dentro do Bottom Sheet -----

const moreItems: MobileNavItem[] = [
  { to: '/finance', label: 'Finanças', icon: <Wallet className="h-5 w-5" /> },
  { to: '/tasks', label: 'Tarefas', icon: <ListTodo className="h-5 w-5" /> },
  { to: '/settings', label: 'Categorias', icon: <Tag className="h-5 w-5" /> },
  { to: '/profile', label: 'Perfil', icon: <User className="h-5 w-5" /> },
]

export function MobileNav() {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const closeMore = () => setIsMoreOpen(false)

  const handleSignOut = async () => {
    closeMore()
    await signOut()
    navigate('/auth')
  }

  return (
    <>
      {/* ---------- Overlay escuro ---------- */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          isMoreOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMore}
      />

      {/* ---------- Bottom Sheet ---------- */}
      <div
        className={`fixed bottom-[72px] left-0 right-0 z-50 rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl transition-all duration-300 ease-in-out lg:hidden ${
          isMoreOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-full opacity-0'
        }`}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <span className="text-sm font-semibold text-slate-200">
            Mais Opções
          </span>
          <button
            onClick={closeMore}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Links */}
        <div className="space-y-1 px-3 py-3">
          {moreItems.map((item) => {
            const isProfile = item.to === '/profile'

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMore}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                {isProfile && profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  item.icon
                )}
                {item.label}
              </NavLink>
            )
          })}

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>

      {/* ---------- Barra fixa inferior ---------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around py-2">
          {primaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeMore}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          {/* Botão Mais */}
          <button
            onClick={() => setIsMoreOpen((v) => !v)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
              isMoreOpen
                ? 'text-primary-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Menu className="h-5 w-5" />
            Mais
          </button>
        </div>
      </nav>
    </>
  )
}
