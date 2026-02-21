import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Briefcase, BookOpen, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface MobileNavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const navItems: MobileNavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { to: '/work', label: 'Trabalho', icon: <Briefcase className="h-5 w-5" /> },
  { to: '/study', label: 'Estudos', icon: <BookOpen className="h-5 w-5" /> },
]

export function MobileNav() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
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

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </nav>
  )
}
