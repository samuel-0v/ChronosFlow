import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  /** Controla visibilidade */
  isOpen: boolean
  /** Callback para fechar */
  onClose: () => void
  /** Título no header */
  title?: string
  /** Conteúdo do modal */
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fechar com ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    // Bloquear scroll do body
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Fechar ao clicar fora (no overlay)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
