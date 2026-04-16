import { toast } from 'sonner'

const DURATION_MS = 10_000
export { DURATION_MS }

interface Props {
  toastId: string | number
  label: string
  undoLabel: string
  onUndo: () => void
}

export function UndoToastContent({ toastId, label, undoLabel, onUndo }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-gray-900 px-4 py-3 shadow-lg dark:bg-gray-800">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-gray-100">{label}</span>
        <button
          onClick={() => {
            toast.dismiss(toastId)
            onUndo()
          }}
          className="shrink-0 text-sm font-semibold text-brand-400 hover:text-brand-300"
        >
          {undoLabel}
        </button>
      </div>
      {/* Countdown bar — shrinks left-to-right over DURATION_MS via CSS animation */}
      <div className="absolute bottom-0 start-0 h-0.5 w-full bg-gray-700 dark:bg-gray-600">
        <div
          className="h-full origin-[left_center] bg-brand-500"
          style={{ animation: `undo-countdown ${DURATION_MS}ms linear forwards` }}
        />
      </div>
    </div>
  )
}
