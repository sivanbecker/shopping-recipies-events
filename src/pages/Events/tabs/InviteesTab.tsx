import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Check, Bus, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { inviteeSummary } from '@/lib/eventHelpers'
import type { EventInvitee, Contact } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  eventId: string
  isOwner: boolean
  totalInviteePeople?: number
}

// ─── Add Invitee Sheet ────────────────────────────────────────────────────────

interface AddSheetProps {
  eventId: string
  onClose: () => void
}

function AddInviteeSheet({ eventId, onClose }: AddSheetProps) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'contacts' | 'new'>('contacts')

  // Form state for new guest
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  const [brings, setBrings] = useState('')
  const [needsTransport, setNeedsTransport] = useState(false)

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('name')
      if (error) throw error
      return data
    },
  })

  // Already-added invitee names to avoid duplicates
  const { data: existing = [] } = useQuery<EventInvitee[]>({
    queryKey: ['event-invitees', eventId],
  })
  const existingNames = new Set(existing.map(i => i.name.toLowerCase()))

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

  const handleAddFromContact = (contact: Contact) => {
    addMutation.mutate({
      name: contact.name,
      phone: contact.phone,
      party_size: contact.party_size,
      confirmed: false,
      needs_transport: false,
      contact_id: contact.id,
    })
  }

  const handleAddNew = () => {
    if (!name.trim()) return
    addMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || null,
      party_size: partySize,
      confirmed,
      brings: brings.trim() || null,
      needs_transport: needsTransport,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-t-2xl bg-white pb-8 shadow-xl dark:bg-gray-900">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Tabs */}
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

        {tab === 'contacts' ? (
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
                      disabled={alreadyAdded || addMutation.isPending}
                      onClick={() => handleAddFromContact(contact)}
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
        ) : (
          <div className="space-y-3 px-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('guests.name')} *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('contacts.namePlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('guests.phone')}
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t('contacts.phonePlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Party size */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t('contacts.partySize')}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPartySize(p => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {partySize}
                </span>
                <button
                  onClick={() => setPartySize(p => p + 1)}
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
                value={brings}
                onChange={e => setBrings(e.target.value)}
                placeholder={t('invitees.bringsPlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            {/* Toggles */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmed(v => !v)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  confirmed
                    ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                {t('guests.confirmed')}
              </button>
              <button
                onClick={() => setNeedsTransport(v => !v)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  needsTransport
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                <Bus className="h-3.5 w-3.5" />
                {t('guests.needsTransport')}
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={handleAddNew}
              disabled={!name.trim() || addMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('invitees.add')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Transport picker ─────────────────────────────────────────────────────────

interface TransportPickerProps {
  invitees: EventInvitee[]
  currentId: string
  currentTransportBy: string | null
  onSelect: (driverId: string | null) => void
}

function TransportPicker({
  invitees,
  currentId,
  currentTransportBy,
  onSelect,
}: TransportPickerProps) {
  const { t } = useTranslation('events')
  const others = invitees.filter(i => i.id !== currentId && !i.needs_transport)
  return (
    <select
      value={currentTransportBy ?? ''}
      onChange={e => onSelect(e.target.value || null)}
      className="mt-0.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      <option value="">{t('guests.transportBy')}</option>
      {others.map(inv => (
        <option key={inv.id} value={inv.id}>
          {inv.name}
        </option>
      ))}
    </select>
  )
}

// ─── InviteesTab ──────────────────────────────────────────────────────────────

export default function InviteesTab({ eventId, isOwner }: Props) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

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

  // Summary stats
  const { confirmed, needsTransport: needTransport, totalPeople } = inviteeSummary(invitees)

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
      <div className="flex items-center justify-between">
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

                  {/* Transport picker when needs_transport */}
                  {invitee.needs_transport && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Bus className="h-3 w-3 shrink-0" />
                      <TransportPicker
                        invitees={invitees}
                        currentId={invitee.id}
                        currentTransportBy={invitee.transport_by}
                        onSelect={driverId =>
                          updateTransportMutation.mutate({ id: invitee.id, transport_by: driverId })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
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

      {/* Empty hint */}
      {invitees.length === 0 && isOwner && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          {t('invitees.emptyHint')}
        </p>
      )}

      {showAdd && <AddInviteeSheet eventId={eventId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
