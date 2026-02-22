import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Registrar Service Worker para PWA
// onNeedRefresh: não força reload automático — exibe apenas no console.
// O usuário pode recarregar manualmente quando quiser a nova versão.
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[SW] Nova versão disponível. Recarregue a página para atualizar.')
  },
  onOfflineReady() {
    console.info('[SW] App pronto para uso offline.')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
