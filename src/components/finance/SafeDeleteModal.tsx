import { type FormEvent, useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// ===================== Props =====================

interface SafeDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  /** Nome do recurso que será exibido e que o usuário deve digitar para confirmar */
  resourceName: string
  /** Descrição adicional (ex: "Todas as transações desta conta serão excluídas.") */
  warningText?: string
  /** Callback de exclusão — retorna true se deletou com sucesso */
  onConfirm: () => Promise<boolean>
}

// ===================== Componente =====================

export function SafeDeleteModal({
  isOpen,
  onClose,
  resourceName,
  warningText,
  onConfirm,
}: SafeDeleteModalProps) {
  const [typed, setTyped] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canDelete = typed.trim().toLowerCase() === resourceName.trim().toLowerCase()

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setTyped('')
      setError(null)
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canDelete) return
    setIsDeleting(true)
    setError(null)

    const ok = await onConfirm()
    setIsDeleting(false)

    if (!ok) {
      setError('Erro ao excluir. Tente novamente.')
      return
    }

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Warning banner */}
        <div className="flex gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="space-y-1 text-sm text-red-300">
            <p>
              Esta ação é <strong className="text-red-200">irreversível</strong>.
            </p>
            {warningText && <p className="text-red-400/80">{warningText}</p>}
          </div>
        </div>

        {/* Instrução */}
        <p className="text-sm text-slate-400">
          Para confirmar, digite{' '}
          <strong className="font-semibold text-slate-200">{resourceName}</strong>{' '}
          abaixo:
        </p>

        {/* Input de confirmação */}
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={resourceName}
          autoFocus
        />

        {/* Erro */}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!canDelete}
            isLoading={isDeleting}
          >
            Excluir
          </Button>
        </div>
      </form>
    </Modal>
  )
}
