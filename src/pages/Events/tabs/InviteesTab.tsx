import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  Loader2,
  Check,
  Bus,
  UserPlus,
  Users,
  Pencil,
  ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { inviteeSummary } from '@/lib/eventHelpers'
import type { EventInvitee, Contact } from '@/types'

// ─── Shared field state ───────────────────────────────────────────────────────

interface GuestFields {
  name: string
  phone: string
  partySize: number
  confirmed: boolean
  brings: string
  needsTransport: boolean
}

function defaultFields(): GuestFields {
  return { name: '', phone: '', partySize: 1, confirmed: false, brings: '', needsTransport: false }
}

function fieldsFromInvitee(i: EventInvitee): GuestFields {
  return {
    name: i.name,
    phone: i.phone ?? '',
    partySize: i.party_size,
    confirmed: i.confirmed,
    brings: i.brings ?? '',
    needsTransport: i.needs_transport,
  }
}

// ─── GuestFieldsForm ──────────────────────────────────────────────────────────
// Reusable form block used by both Add and Edit sheets.

interface FieldsFormProps {
  fields: GuestFields
  onChange: (f: GuestFields) => void
  nameLocked?: boolean // prevent editing name when coming from contacts
}

function GuestFieldsForm({ fields, onChange, nameLocked }: FieldsFormProps) {
  const { t } = useTranslation('events')
  const set = (patch: Partial<GuestFields>) => onChange({ ...fields, ...patch })

  return (
    <div className="space-y-3">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('guests.name')} *
        </label>
        <input
          value={fields.name}
          onChange={e => set({ name: e.target.value })}
          placeholder={t('contacts.namePlaceholder')}
          disabled={nameLocked}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-800/50"
        />
      </div>

      {/* Phone */}
      {!nameLocked && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            {t('guests.phone')}
          </label>
          <input
            value={fields.phone}
            onChange={e => set({ phone: e.target.value })}
            placeholder={t('contacts.phonePlaceholder')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>
      )}

      {/* Party size */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('contacts.partySize')}
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => set({ partySize: Math.max(1, fields.partySize - 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
            {fields.partySize}
          </span>
          <button
            onClick={() => set({ partySize: fields.partySize + 1 })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            +
          </button>
        </div>
      </div>

      {/* Brings */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('guests.brings')}
        </label>
        <input
          value={fields.brings}
          onChange={e => set({ brings: e.target.value })}
          placeholder={t('invitees.bringsPlaceholder')}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-3">
        <button
          onClick={() => set({ confirmed: !fields.confirmed })}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            fields.confirmed
              ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          {t('guests.confirmed')}
        </button>
        <button
          onClick={() => set({ needsTransport: !fields.needsTransport })}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            fields.needsTransport
              ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
          }`}
        >
          <Bus className="h-3.5 w-3.5" />
          {t('guests.needsTransport')}
        </button>
      </div>
    </div>
  )
}

// ─── Add Invitee Sheet ────────────────────────────────────────────────────────

interface AddSheetProps {
  eventId: string
  existingNames: Set<string>
  onClose: () => void
}

function AddInviteeSheet({ eventId, existingNames, onClose }: AddSheetProps) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'contacts' | 'new'>('contacts')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [fields, setFields] = useState<GuestFields>(defaultFields())

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('name')
      if (error) throw error
      return data
    },
  })

  const addMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      phone?: string | null
      party_size: number
      confirmed: boolean
      brings?: string | null
      needs_transport: boolean
      contact_id?: string | null
    }) => {
      const { error } = await supabase.from('event_invitees').insert({
        event_id: eventId,
        ...payload,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invitees', eventId] })
      onClose()
    },
    onError: () => toast.error(t('invitees.addError')),
  })

  const handleAddFromContact = () => {
    if (!selectedContact) return
    addMutation.mutate({
      name: selectedContact.name,
      phone: selectedContact.phone,
      party_size: selectedContact.party_size,
      confirmed: fields.confirmed,
      brings: fields.brings.trim() || null,
      needs_transport: fields.needsTransport,
      contact_id: selectedContact.id,
    })
  }

  const handleAddNew = () => {
    if (!fields.name.trim()) return
    addMutation.mutate({
      name: fields.name.trim(),
      phone: fields.phone.trim() || null,
      party_size: fields.partySize,
      confirmed: fields.confirmed,
      brings: fields.brings.trim() || null,
      needs_transport: fields.needsTransport,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white pb-8 shadow-xl sm:rounded-2xl dark:bg-gray-900">
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        {/* Close gap on desktop */}
        <div className="hidden sm:block sm:pt-4" />

        {/* Tab switcher */}
        {!selectedContact && (
          <div className="flex gap-1 px-4 pb-3">
            <button
              onClick={() => setTab('contacts')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === 'contacts'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t('invitees.fromContacts')}
            </button>
            <button
              onClick={() => setTab('new')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                tab === 'new'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {t('invitees.newGuest')}
            </button>
          </div>
        )}

        {/* Contacts tab */}
        {tab === 'contacts' && !selectedContact && (
          <div className="max-h-72 overflow-y-auto px-4">
            {contacts.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                {t('contacts.empty')}
              </p>
            ) : (
              <div className="space-y-1">
                {contacts.map(contact => {
                  const alreadyAdded = existingNames.has(contact.name.toLowerCase())
                  return (
                    <button
                      key={contact.id}
                      disabled={alreadyAdded}
                      onClick={() => {
                        setSelectedContact(contact)
                        setFields(f => ({ ...f, partySize: contact.party_size }))
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-gray-50 disabled:opacity-40 dark:hover:bg-gray-800"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {contact.party_size > 1
                            ? t('contacts.people', { count: contact.party_size })
                            : t('contacts.person', { count: 1 })}
                          {contact.phone ? ` · ${contact.phone}` : ''}
                          {contact.can_drive ? ` · 🚗` : ''}
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Plus className="h-4 w-4 text-purple-500" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Contact confirm step */}
        {tab === 'contacts' && selectedContact && (
          <div className="space-y-3 px-4">
            {/* Back + contact name */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedContact(null)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="rounded-xl bg-purple-50 px-3 py-1.5 dark:bg-purple-900/20">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                  {selectedContact.name}
                </p>
              </div>
            </div>

            {/* Only brings + toggles — name/phone/party_size come from contact */}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t('guests.brings')}
                </label>
                <input
                  value={fields.brings}
                  onChange={e => setFields(f => ({ ...f, brings: e.target.value }))}
                  placeholder={t('invitees.bringsPlaceholder')}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setFields(f => ({ ...f, confirmed: !f.confirmed }))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    fields.confirmed
                      ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {t('guests.confirmed')}
                </button>
                <button
                  onClick={() => setFields(f => ({ ...f, needsTransport: !f.needsTransport }))}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    fields.needsTransport
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Bus className="h-3.5 w-3.5" />
                  {t('guests.needsTransport')}
                </button>
              </div>
            </div>

            <button
              onClick={handleAddFromContact}
              disabled={addMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('invitees.add')}
            </button>
          </div>
        )}

        {/* New guest tab */}
        {tab === 'new' && (
          <div className="space-y-1 px-4">
            <GuestFieldsForm fields={fields} onChange={setFields} />
            <div className="pt-2">
              <button
                onClick={handleAddNew}
                disabled={!fields.name.trim() || addMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('invitees.add')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Edit Invitee Sheet ───────────────────────────────────────────────────────

interface EditSheetProps {
  invitee: EventInvitee
  onClose: () => void
}

function EditInviteeSheet({ invitee, onClose }: EditSheetProps) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [fields, setFields] = useState<GuestFields>(fieldsFromInvitee(invitee))

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('event_invitees')
        .update({
          name: fields.name.trim(),
          phone: fields.phone.trim() || null,
          party_size: fields.partySize,
          confirmed: fields.confirmed,
          brings: fields.brings.trim() || null,
          needs_transport: fields.needsTransport,
        })
        .eq('id', invitee.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-invitees', invitee.event_id] })
      onClose()
    },
    onError: () => toast.error(t('invitees.editError')),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white pb-8 shadow-xl sm:rounded-2xl dark:bg-gray-900">
        <div className="flex justify-center pt-3 pb-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="hidden sm:block sm:pt-4" />
        <p className="px-4 pb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('invitees.edit')}
        </p>
        <div className="px-4">
          <GuestFieldsForm fields={fields} onChange={setFields} nameLocked={!!invitee.contact_id} />
          <button
            onClick={() => mutation.mutate()}
            disabled={!fields.name.trim() || mutation.isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Transport picker ─────────────────────────────────────────────────────────

interface TransportPickerProps {
  invitees: EventInvitee[]
  contacts: Contact[]
  currentId: string
  currentTransportBy: string | null
  onSelect: (driverId: string | null) => void
}

function TransportPicker({
  invitees,
  contacts,
  currentId,
  currentTransportBy,
  onSelect,
}: TransportPickerProps) {
  const { t } = useTranslation('events')

  // Drivers: other invitees whose linked contact has can_drive=true
  const driverContactIds = new Set(contacts.filter(c => c.can_drive).map(c => c.id))
  const drivers = invitees.filter(
    i => i.id !== currentId && i.contact_id !== null && driverContactIds.has(i.contact_id)
  )

  if (drivers.length === 0) return null

  return (
    <select
      value={currentTransportBy ?? ''}
      onChange={e => onSelect(e.target.value || null)}
      className="mt-0.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      <option value="">{t('guests.transportBy')}</option>
      {drivers.map(inv => (
        <option key={inv.id} value={inv.id}>
          {inv.name}
        </option>
      ))}
    </select>
  )
}

// ─── InviteesTab ──────────────────────────────────────────────────────────────

interface Props {
  eventId: string
  isOwner: boolean
}

export default function InviteesTab({ eventId, isOwner }: Props) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editingInvitee, setEditingInvitee] = useState<EventInvitee | null>(null)

  const { data: invitees = [], isLoading } = useQuery<EventInvitee[]>({
    queryKey: ['event-invitees', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_invitees')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at')
      if (error) throw error
      return data
    },
  })

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('name')
      if (error) throw error
      return data
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string
      field: 'confirmed' | 'needs_transport'
      value: boolean
    }) => {
      const { error } = await supabase
        .from('event_invitees')
        .update({ [field]: value })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-invitees', eventId] }),
  })

  const updateTransportMutation = useMutation({
    mutationFn: async ({ id, transport_by }: { id: string; transport_by: string | null }) => {
      const { error } = await supabase.from('event_invitees').update({ transport_by }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-invitees', eventId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_invitees').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-invitees', eventId] }),
    onError: () => toast.error(t('invitees.deleteError')),
  })

  const { confirmed, needsTransport: needTransport, totalPeople } = inviteeSummary(invitees)
  const existingNames = new Set(invitees.map(i => i.name.toLowerCase()))

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary + Add button */}
      <div className="flex items-center justify-between gap-2">
        {invitees.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t('invitees.confirmedCount', { count: confirmed, total: invitees.length })}
            </span>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              <Users className="mr-1 inline h-3 w-3" />
              {t('invitees.peopleCount', { count: totalPeople })}
            </span>
            {needTransport > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                <Bus className="mr-1 inline h-3 w-3" />
                {t('invitees.transportCount', { count: needTransport })}
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('invitees.empty')}</p>
        )}

        {isOwner && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            <UserPlus className="h-4 w-4" />
            {t('invitees.add')}
          </button>
        )}
      </div>

      {/* Invitee list */}
      {invitees.length > 0 && (
        <div className="space-y-2">
          {invitees.map(invitee => (
            <div key={invitee.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-900">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Name + party size */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {invitee.name}
                    </span>
                    {invitee.party_size > 1 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {t('contacts.people', { count: invitee.party_size })}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  {invitee.phone && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {invitee.phone}
                    </p>
                  )}

                  {/* Brings */}
                  {invitee.brings && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{t('guests.brings')}:</span> {invitee.brings}
                    </p>
                  )}

                  {/* Transport picker */}
                  {invitee.needs_transport && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Bus className="h-3 w-3 shrink-0" />
                      <TransportPicker
                        invitees={invitees}
                        contacts={contacts}
                        currentId={invitee.id}
                        currentTransportBy={invitee.transport_by}
                        onSelect={driverId =>
                          updateTransportMutation.mutate({
                            id: invitee.id,
                            transport_by: driverId,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex shrink-0 items-center gap-1">
                  {/* Transport toggle */}
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: invitee.id,
                        field: 'needs_transport',
                        value: !invitee.needs_transport,
                      })
                    }
                    title={t('guests.needsTransport')}
                    className={`rounded-lg p-1.5 transition ${
                      invitee.needs_transport
                        ? 'text-amber-500'
                        : 'text-gray-300 hover:text-amber-400 dark:text-gray-600 dark:hover:text-amber-500'
                    }`}
                  >
                    <Bus className="h-4 w-4" />
                  </button>

                  {/* Confirmed toggle */}
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        id: invitee.id,
                        field: 'confirmed',
                        value: !invitee.confirmed,
                      })
                    }
                    title={t('guests.confirmed')}
                    className={`rounded-lg p-1.5 transition ${
                      invitee.confirmed
                        ? 'text-green-500'
                        : 'text-gray-300 hover:text-green-400 dark:text-gray-600 dark:hover:text-green-500'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  {/* Edit */}
                  {isOwner && (
                    <button
                      onClick={() => setEditingInvitee(invitee)}
                      className="rounded-lg p-1.5 text-gray-300 hover:text-purple-500 dark:text-gray-600 dark:hover:text-purple-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* Delete */}
                  {isOwner && (
                    <button
                      onClick={() => deleteMutation.mutate(invitee.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {invitees.length === 0 && isOwner && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          {t('invitees.emptyHint')}
        </p>
      )}

      {showAdd && (
        <AddInviteeSheet
          eventId={eventId}
          existingNames={existingNames}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editingInvitee && (
        <EditInviteeSheet invitee={editingInvitee} onClose={() => setEditingInvitee(null)} />
      )}
    </div>
  )
}
