import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { TimerProvider } from '@/contexts/TimerContext'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { Work } from '@/pages/Work'
import { Study } from '@/pages/Study'
import { SettingsPage } from '@/pages/Settings'
import { Profile } from '@/pages/Profile'
import { Tasks } from '@/pages/Tasks'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="auth" element={<Auth />} />

          {/* Rotas protegidas — TimerProvider vive aqui para sobreviver à navegação */}
          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <TimerProvider>
                  <Layout />
                </TimerProvider>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="work" element={<Work />} />
              <Route path="study" element={<Study />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
