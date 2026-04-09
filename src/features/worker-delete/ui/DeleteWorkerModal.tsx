import { AlertTriangle } from 'lucide-react'
import { useDeleteWorker } from '../model/useDeleteWorker'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'

interface DeleteWorkerModalProps {
  workerId: string
  workerName: string
  open: boolean
  onClose: () => void
}

export function DeleteWorkerModal({ workerId, workerName, open, onClose }: DeleteWorkerModalProps) {
  const { mutate, isPending } = useDeleteWorker(onClose)

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader onClose={onClose}>Ishchini o'chirish</ModalHeader>
      <ModalBody className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15">
          <AlertTriangle size={28} className="text-danger" />
        </div>
        <div>
          <p className="font-medium text-ivory">
            <span className="text-gold">{workerName}</span> ni o'chirmoqchimisiz?
          </p>
          <p className="mt-1 text-sm text-silver">Bu amalni bekor qilib bo'lmaydi.</p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
        <Button variant="danger" loading={isPending} onClick={() => mutate(workerId)}>
          O'chirish
        </Button>
      </ModalFooter>
    </Modal>
  )
}
