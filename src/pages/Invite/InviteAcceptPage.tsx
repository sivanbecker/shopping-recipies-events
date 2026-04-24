import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, UserCheck, XCircle, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

type PageState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'expired'; inviterName: string }
  | { kind: 'already_responded'; status: string }
  | { kind: 'email_mismatch'; inviteeEmail: string }
  | { kind: 'unauthenticated'; inviterName: string; label: string | null }
  | { kind: 'pending'; inviterName: string; label: string | null }
  | { kind: 'success'; inviterName: string }
  | { kind: 'declined' }

function labelText(label: string | null, t: (k: string) => string): string {
  if (label === 'family') return t('events:contacts.labelFamily')
  if (label === 'friend') return t('events:contacts.labelFriend')
  return t('events:contacts.invite.labelContact')
}

export default function InviteAcceptPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<PageState>({ kind: 'loading' })
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid' })
      return
    }

    supabase.rpc('peek_invitation', { p_token: token }).then(({ data, error }) => {
      if (error || !data || data.length === 0) {
        setState({ kind: 'invalid' })
        return
      }

      const inv = data[0]

      if (inv.status === 'accepted') {
        setState({ kind: 'already_responded', status: inv.status })
        return
      }
      if (inv.status === 'declined' || inv.status === 'revoked') {
        setState({ kind: 'already_responded', status: inv.status })
        return
      }
      if (new Date(inv.expires_at) < new Date() || inv.status === 'expired') {
        setState({ kind: 'expired', inviterName: inv.inviter_name })
        return
      }

      // status is 'pending' and not expired
      if (!user) {
        setState({ kind: 'unauthenticated', inviterName: inv.inviter_name, label: inv.label })
      } else {
        setState({ kind: 'pending', inviterName: inv.inviter_name, label: inv.label })
      }
    })
  }, [token, user])

  async function handleAction(action: 'accept' | 'decline') {
    setActing(true)
    const { data, error } = await supabase.functions.invoke('accept-contact-invitation', {
      body: { token, action },
    })
    setActing(false)

    // error is a network/HTTP error; data.error is a business logic error from the RPC
    if (error || data?.error) {
      console.error('accept/decline error:', error ?? data?.error)
      if (data?.error === 'email_mismatch') {
        setState({ kind: 'email_mismatch', inviteeEmail: state.kind === 'pending' ? '' : '' })
        return
      }
      setState({ kind: 'loading' }) // re-peek to show updated status
      return
    }

    if (action === 'accept') {
      setState({ kind: 'success', inviterName: data?.inviter_name ?? '' })
    } else {
      setState({ kind: 'declined' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
        <h1 className="mb-6 text-center text-2xl font-bold text-indigo-600">Shop Cook Host</h1>

        {state.kind === 'loading' && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>{t('events:contacts.invite.loading')}</p>
          </div>
        )}

        {state.kind === 'invalid' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <XCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.invalidTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('events:contacts.invite.invalidBody')}</p>
          </div>
        )}

        {state.kind === 'expired' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Clock className="h-12 w-12 text-amber-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.expiredTitle')}
            </h2>
            <p className="text-sm text-gray-500">
              {t('events:contacts.invite.expiredBody', { name: state.inviterName })}
            </p>
          </div>
        )}

        {state.kind === 'already_responded' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <XCircle className="h-12 w-12 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.alreadyRespondedTitle')}
            </h2>
          </div>
        )}

        {state.kind === 'email_mismatch' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <XCircle className="h-12 w-12 text-red-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.emailMismatchTitle')}
            </h2>
            <p className="text-sm text-gray-500">{t('events:contacts.invite.emailMismatchBody')}</p>
          </div>
        )}

        {state.kind === 'unauthenticated' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <UserCheck className="h-12 w-12 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.acceptTitle', { name: state.inviterName })}
            </h2>
            <p className="text-sm text-gray-500">
              {t('events:contacts.invite.acceptSubtitle', {
                name: state.inviterName,
                label: labelText(state.label, t),
              })}
            </p>
            <p className="text-sm text-gray-500">{t('events:contacts.invite.signInPrompt')}</p>
            <div className="flex w-full flex-col gap-2">
              <button
                onClick={() =>
                  navigate('/auth', { state: { inviteToken: token, mode: 'register' } })
                }
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {t('events:contacts.invite.signUp')}
              </button>
              <button
                onClick={() => navigate('/auth', { state: { inviteToken: token, mode: 'login' } })}
                className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('events:contacts.invite.logIn')}
              </button>
            </div>
          </div>
        )}

        {state.kind === 'pending' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <UserCheck className="h-12 w-12 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.acceptTitle', { name: state.inviterName })}
            </h2>
            <p className="text-sm text-gray-500">
              {t('events:contacts.invite.acceptSubtitle', {
                name: state.inviterName,
                label: labelText(state.label, t),
              })}
            </p>
            <div className="flex w-full flex-col gap-2">
              <button
                onClick={() => handleAction('accept')}
                disabled={acting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {acting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('events:contacts.invite.acceptButton')}
              </button>
              <button
                onClick={() => handleAction('decline')}
                disabled={acting}
                className="w-full rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {t('events:contacts.invite.declineButton')}
              </button>
            </div>
          </div>
        )}

        {state.kind === 'success' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.acceptSuccess', { name: state.inviterName })}
            </h2>
            <Link
              to="/contacts"
              className="mt-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {t('events:contacts.invite.viewContacts')}
            </Link>
          </div>
        )}

        {state.kind === 'declined' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {t('events:contacts.invite.declineSuccess')}
            </h2>
          </div>
        )}
      </div>
    </div>
  )
}
