import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Contact } from '@/types'

interface Props {
  /** Called when a contact chip is tapped. Receives the resolved email (if any) and the contact itself. */
  onSelect: (email: string, contact: Contact) => void
  /** Contacts already added — their chips appear dimmed and non-interactive. */
  excludedUserIds?: string[]
}

type LabelFilter = 'all' | 'family' | 'friend'

export function ContactPicker({ onSelect, excludedUserIds = [] }: Props) {
  const { t } = useTranslation(['shopping', 'events'])
  const { user } = useAuth()
  const [filter, setFilter] = useState<LabelFilter>('all')

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Contact[]
    },
    enabled: !!user,
  })

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.label === filter)

  if (contacts.length === 0) return null

  const filterOptions: { value: LabelFilter; key: string }[] = [
    { value: 'all', key: 'events:contacts.filterAll' },
    { value: 'family', key: 'events:contacts.labelFamily' },
    { value: 'friend', key: 'events:contacts.labelFriend' },
  ]

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {t('sharing.contactsSection')}
      </p>

      {/* Label filter pills */}
      <div className="mb-2 flex gap-1.5">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === opt.value
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {t(opt.key)}
          </button>
        ))}
      </div>

      {/* Contact chips */}
      <div className="flex flex-wrap gap-2">
        {filtered.map(contact => {
          const resolvedEmail = contact.email ?? ''
          const isExcluded =
            contact.linked_user_id != null && excludedUserIds.includes(contact.linked_user_id)
          const hasEmail = !!resolvedEmail

          return (
            <button
              key={contact.id}
              disabled={isExcluded || !hasEmail}
              onClick={() => {
                if (!isExcluded && hasEmail) onSelect(resolvedEmail, contact)
              }}
              title={
                isExcluded
                  ? undefined
                  : !hasEmail
                    ? 'No email — edit this contact to add one'
                    : undefined
              }
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                isExcluded
                  ? 'border-gray-100 bg-gray-50 text-gray-300 opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
                  : !hasEmail
                    ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400 opacity-60 dark:border-gray-700 dark:bg-gray-900'
                    : contact.label === 'family'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30'
                      : contact.label === 'friend'
                        ? 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-800/40 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {contact.linked_user_id && <Link2 className="h-3 w-3 shrink-0 opacity-70" />}
              <span className="font-medium">{contact.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
