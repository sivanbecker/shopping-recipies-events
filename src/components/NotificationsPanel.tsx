import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { Notification, NotificationType } from '@/types'

function notificationText(n: Notification, t: ReturnType<typeof useTranslation>['t']): string {
  const actor = t('notifications.someone')
  return t(`notifications.types.${n.notification_type as NotificationType}`, { actor })
}

interface Props {
  onClose: () => void
  notifications: Notification[]
  isLoading: boolean
  markRead: (id: string) => void
  markAllRead: () => void
}

export function NotificationsPanel({ onClose, notifications, isLoading, markRead, markAllRead }: Props) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  function handleClick(n: Notification) {
    if (!n.read_at) markRead(n.id)
    const listId = n.list_id ?? null
    if (listId) {
      navigate(`/lists/${listId}`)
      onClose()
    }
  }

  return (
    <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('notifications.title')}
        </h3>
        {notifications.some(n => !n.read_at) && (
          <button
            onClick={() => markAllRead()}
            className="text-xs text-brand-500 hover:text-brand-700"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">{t('status.loading')}</div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">{t('notifications.empty')}</div>
        ) : (
          <ul>
            {notifications.map(n => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-3 px-4 py-3 text-start transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !n.read_at ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                  }`}
                >
                  {!n.read_at && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  )}
                  <div className={!n.read_at ? '' : 'ms-5'}>
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {notificationText(n, t)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
