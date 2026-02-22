import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Briefcase, BookOpen, ListTodo, Tag, Timer, X, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { to: '/work', label: 'Trabalho', icon: <Briefcase className="h-5 w-5" /> },
  { to: '/study', label: 'Estudos', icon: <BookOpen className="h-5 w-5" /> },
  { to: '/tasks', label: 'Tarefas', icon: <ListTodo className="h-5 w-5" /> },
  { to: '/settings', label: 'Categorias', icon: <Tag className="h-5 w-5" /> },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-64 flex-col
          bg-slate-900 border-r border-slate-800
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <Timer className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-100">
              ChronosFlow
            </span>
          </div>

          {/* Botão fechar — só mobile */}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <NavLink
              to="/profile"
              onClick={onClose}
              className="shrink-0 rounded-full ring-2 ring-transparent transition-all hover:ring-primary-500"
              title="Editar perfil"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600/20 text-xs font-bold text-primary-400">
                  {(() => {
                    const name = profile?.full_name ?? user?.user_metadata?.full_name ?? ''
                    const parts = (name as string).trim().split(/\s+/)
                    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
                    if (parts[0]) return parts[0][0].toUpperCase()
                    return user?.email?.charAt(0).toUpperCase() ?? 'U'
                  })()}
                </div>
              )}
            </NavLink>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {profile?.full_name ?? user?.user_metadata?.full_name ?? 'Usuário'}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sair"
              className="shrink-0 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
