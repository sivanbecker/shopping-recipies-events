import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Phone,
  UserPlus,
  Car,
  Link2,
  Mail,
  Send,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Contact } from '@/types'
import type { Database } from '@/types/database'

type LabelFilter = 'all' | 'family' | 'friend'
type ContactInvitation = Database['public']['Tables']['contact_invitations']['Row']

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin

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
  const [email, setEmail] = useState(contact?.email ?? '')
  const [partySize, setPartySize] = useState(contact?.party_size ?? 1)
  const [canDrive, setCanDrive] = useState(contact?.can_drive ?? false)
  const [label, setLabel] = useState<'family' | 'friend' | null>(contact?.label ?? null)
  const [linkStatus, setLinkStatus] = useState<'idle' | 'linked' | 'not_found'>(
    contact?.linked_user_id ? 'linked' : 'idle'
  )

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmedEmail = email.trim() || null

      let linkedUserId: string | null = contact?.linked_user_id ?? null

      if (trimmedEmail) {
        const { data: found } = await supabase.rpc('find_user_by_email', {
          p_email: trimmedEmail,
        })
        if (found && found.length > 0) {
          linkedUserId = found[0].user_id
          setLinkStatus('linked')
        } else {
          linkedUserId = null
          setLinkStatus('not_found')
        }
      } else {
        linkedUserId = null
        setLinkStatus('idle')
      }

      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: trimmedEmail,
        party_size: partySize,
        can_drive: canDrive,
        label: label,
        linked_user_id: linkedUserId,
      }

      if (isEdit) {
        const { error } = await supabase.from('contacts').update(payload).eq('id', contact!.id)
        if (error) throw error
        await supabase
          .from('event_invitees')
          .update({ name: name.trim(), phone: phone.trim() || null, party_size: partySize })
          .eq('contact_id', contact!.id)
      } else {
        const { error } = await supabase.from('contacts').insert({ owner_id: user!.id, ...payload })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['event-invitees'] })
      onClose()
    },
    onError: () => toast.error('Failed to save contact'),
  })

  const labelOptions: { value: 'family' | 'friend' | null; key: string }[] = [
    { value: null, key: 'contacts.labelNone' },
    { value: 'family', key: 'contacts.labelFamily' },
    { value: 'friend', key: 'contacts.labelFriend' },
  ]

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
          {/* Name */}
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

          {/* Label */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('contacts.label')}
            </label>
            <div className="flex gap-2">
              {labelOptions.map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setLabel(opt.value)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    label === opt.value
                      ? opt.value === 'family'
                        ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                        : opt.value === 'friend'
                          ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                          : 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                      : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>

          {/* Phone */}
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

          {/* Email + link status */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('contacts.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setLinkStatus('idle')
              }}
              placeholder={t('contacts.emailPlaceholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
            {linkStatus === 'linked' && (
              <p className="mt-1 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                <Link2 className="h-3 w-3" />
                {t('contacts.linkSuccess')}
              </p>
            )}
            {linkStatus === 'not_found' && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t('contacts.linkNotFound')}
              </p>
            )}
          </div>

          {/* Party size */}
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

// ─── InviteContactDialog ──────────────────────────────────────────────────────

interface InviteContactDialogProps {
  onClose: () => void
}

function InviteContactDialog({ onClose }: InviteContactDialogProps) {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [label, setLabel] = useState<'family' | 'friend' | null>(null)
  const [sentToken, setSentToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const labelOptions: { value: 'family' | 'friend' | null; key: string }[] = [
    { value: null, key: 'contacts.labelNone' },
    { value: 'family', key: 'contacts.labelFamily' },
    { value: 'friend', key: 'contacts.labelFriend' },
  ]

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-contact-invitation', {
        body: { invitee_email: email.trim().toLowerCase(), label },
      })
      if (error) throw error
      if (data?.error === 'self_invite') throw new Error('self_invite')
      if (data?.error === 'spam_limit') throw new Error('spam_limit')
      if (data?.error) throw new Error(data.error)
      return data as { ok: boolean; token?: string }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['contact-invitations'] })
      setSentToken(data?.token ?? null)
    },
    onError: (err: Error) => {
      if (err.message === 'self_invite') {
        toast.error(t('contacts.invite.inviteSelfError'))
      } else if (err.message === 'spam_limit') {
        toast.error(t('contacts.invite.inviteSpamError'))
      } else {
        toast.error(err.message)
      }
    },
  })

  const sent = inviteMutation.isSuccess

  async function handleCopyLink() {
    if (!sentToken) return
    const link = `${APP_URL}/invite/accept?token=${sentToken}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {t('contacts.invite.inviteTitle')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-green-700 dark:text-green-400">
                {t('contacts.invite.inviteSent')}
              </p>
            </div>

            {sentToken && (
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t('contacts.invite.inviteCopyLink')}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-600"
            >
              {t('cancel')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('contacts.invite.inviteEmail')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('contacts.emailPlaceholder')}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                autoFocus
              />
            </div>

            {/* Label picker */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('contacts.label')}
              </label>
              <div className="flex gap-2">
                {labelOptions.map(opt => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setLabel(opt.value)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      label === opt.value
                        ? opt.value === 'family'
                          ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                          : opt.value === 'friend'
                            ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                            : 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t(opt.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => inviteMutation.mutate()}
                disabled={!email.trim() || inviteMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {t('contacts.invite.inviteSend')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PendingInvitationsCard ───────────────────────────────────────────────────

function PendingInvitationsCard() {
  const { t } = useTranslation('events')
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(true)

  const { data: invitations = [] } = useQuery<ContactInvitation[]>({
    queryKey: ['contact-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_invitations')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ContactInvitation[]
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase.rpc('revoke_invitation', { p_token: token })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-invitations'] })
      toast.success(t('contacts.invite.pendingRevokeSuccess'))
    },
  })

  if (invitations.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
          {t('contacts.invite.pendingInvites')} ({invitations.length})
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </button>

      {expanded && (
        <div className="divide-y divide-amber-100 border-t border-amber-200 dark:divide-amber-800/30 dark:border-amber-800/40">
          {invitations.map(inv => (
            <div key={inv.id} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {inv.invitee_email}
                  </span>
                  {inv.label === 'family' && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      {t('contacts.labelFamily')}
                    </span>
                  )}
                  {inv.label === 'friend' && (
                    <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
                      {t('contacts.labelFriend')}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {t('contacts.invite.pendingExpiresIn', {
                    time: formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true }),
                  })}
                </p>
              </div>
              <button
                onClick={() => revokeMutation.mutate(inv.token)}
                disabled={revokeMutation.isPending}
                className="ms-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
              >
                {t('contacts.invite.pendingRevoke')}
              </button>
            </div>
          ))}
        </div>
      )}
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
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-gray-800 dark:text-gray-100">
              {contact.name}
            </span>
            {contact.label === 'family' && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {t('contacts.labelFamily')}
              </span>
            )}
            {contact.label === 'friend' && (
              <span className="shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
                {t('contacts.labelFriend')}
              </span>
            )}
            {contact.can_drive && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                <Car className="mr-0.5 inline h-3 w-3" />
                {t('contacts.canDrive')}
              </span>
            )}
            {contact.linked_user_id && (
              <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                <Link2 className="mr-0.5 inline h-3 w-3" />
                {t('contacts.linked')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
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
            {contact.email && !contact.linked_user_id && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {contact.email}
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
  const [showInvite, setShowInvite] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | undefined>()
  const [filter, setFilter] = useState<LabelFilter>('all')

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

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.label === filter)

  function handleEdit(contact: Contact) {
    setEditingContact(contact)
    setShowForm(true)
  }

  function handleClose() {
    setShowForm(false)
    setEditingContact(undefined)
  }

  const filterOptions: { value: LabelFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'contacts.filterAll' },
    { value: 'family', labelKey: 'contacts.labelFamily' },
    { value: 'friend', labelKey: 'contacts.labelFriend' },
  ]

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
          >
            <Send className="h-3.5 w-3.5" />
            {t('contacts.invite.invite')}
          </button>
          <button
            onClick={() => {
              setEditingContact(undefined)
              setShowForm(true)
            }}
            className="flex items-center gap-1.5 rounded-xl bg-purple-500 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-600"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('contacts.add')}
          </button>
        </div>
      </div>

      {/* Pending invitations */}
      <PendingInvitationsCard />

      {/* Filter bar */}
      {contacts.length > 0 && (
        <div className="flex gap-2">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === opt.value
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      )}

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
          {filtered.map(contact => (
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
      {showInvite && <InviteContactDialog onClose={() => setShowInvite(false)} />}
    </div>
  )
}
