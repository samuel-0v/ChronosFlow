import { Timer } from 'lucide-react'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Timer className="h-10 w-10 text-primary-500" />
          <h1 className="text-4xl font-bold text-slate-100">
            ChronosFlow
          </h1>
        </div>
        <p className="text-slate-400">
          Produtividade híbrida — Trabalho Ágil + Estudos
        </p>
      </div>
    </div>
  )
}

export default App
