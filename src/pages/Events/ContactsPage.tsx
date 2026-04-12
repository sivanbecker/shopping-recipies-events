import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Users, Phone, UserPlus, Car } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Contact } from '@/types'

// ─── ContactForm ─────────────────────────────────────────────────────────────

interface ContactFormProps {
  onClose: () => void
  contact?: Contact
}

function ContactForm({ onClose, contact }: ContactFormProps) {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isEdit = !!contact

  const [name, setName] = useState(contact?.name ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [partySize, setPartySize] = useState(contact?.party_size ?? 1)
  const [canDrive, setCanDrive] = useState(contact?.can_drive ?? false)

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const { error } = await supabase
          .from('contacts')
          .update({
            name: name.trim(),
            phone: phone.trim() || null,
            party_size: partySize,
            can_drive: canDrive,
          })
          .eq('id', contact!.id)
        if (error) throw error
        // Sync name, phone, party_size to any invitees created from this contact
        await supabase
          .from('event_invitees')
          .update({ name: name.trim(), phone: phone.trim() || null, party_size: partySize })
          .eq('contact_id', contact!.id)
      } else {
        const { error } = await supabase.from('contacts').insert({
          owner_id: user!.id,
          name: name.trim(),
          phone: phone.trim() || null,
          party_size: partySize,
          can_drive: canDrive,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      // Refresh all event-invitees caches so InviteesTab picks up changes
      queryClient.invalidateQueries({ queryKey: ['event-invitees'] })
      onClose()
    },
    onError: () => toast.error('Failed to save contact'),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100">
          {isEdit ? t('contacts.edit') : t('contacts.add')}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('contacts.name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('contacts.namePlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('contacts.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('contacts.phonePlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('contacts.partySize')}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPartySize(s => Math.max(1, s - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center font-semibold text-gray-800 dark:text-gray-100">
                {partySize}
              </span>
              <button
                onClick={() => setPartySize(s => s + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                +
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('contacts.partySizeHint')}
              </span>
            </div>
          </div>

          {/* Can drive toggle */}
          <button
            type="button"
            onClick={() => setCanDrive(v => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              canDrive
                ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
            }`}
          >
            <Car className="h-4 w-4" />
            {t('contacts.canDrive')}
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? t('save') : t('create')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ContactRow ──────────────────────────────────────────────────────────────

function ContactRow({ contact, onEdit }: { contact: Contact; onEdit: (c: Contact) => void }) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('contacts').delete().eq('id', contact.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })

  return (
    <>
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-gray-800 dark:text-gray-100">
              {contact.name}
            </span>
            {contact.can_drive && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <Car className="mr-0.5 inline h-3 w-3" />
                {t('contacts.canDrive')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {contact.party_size === 1
                ? t('contacts.person', { count: 1 })
                : t('contacts.people', { count: contact.party_size })}
            </span>
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contact.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(contact)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={e => e.target === e.currentTarget && setShowDeleteConfirm(false)}
        >
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              {t('contacts.confirmDelete')}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('contacts.confirmDeleteHint', { name: contact.name })}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate()
                  setShowDeleteConfirm(false)
                }}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── ContactsPage ────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const { t } = useTranslation('events')
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | undefined>()

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
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

  function handleEdit(contact: Contact) {
    setEditingContact(contact)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingContact(undefined)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {t('contacts.title')}
          </h1>
        </div>
      </div>

      {/* Contact list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
            <UserPlus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300">{t('contacts.empty')}</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{t('contacts.emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map(contact => (
            <ContactRow key={contact.id} contact={contact} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          setEditingContact(undefined)
          setShowForm(true)
        }}
        className="fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg hover:bg-purple-600 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showForm && <ContactForm onClose={handleClose} contact={editingContact} />}
    </div>
  )
}
