import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingCart, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { loginSchema, registerSchema, type LoginData, type RegisterData } from '@/lib/schemas'

type View = 'login' | 'register' | 'forgot'

export default function AuthPage() {
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  async function handleLogin(data: LoginData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)
    if (error) {
      toast.error(t('auth.loginError'))
    } else {
      navigate('/lists', { replace: true })
    }
  }

  async function handleRegister(data: RegisterData) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { display_name: data.name } },
    })
    setLoading(false)
    if (error) {
      toast.error(t('auth.registerError'))
    } else {
      toast.success(t('auth.registerSuccess'))
      navigate('/lists', { replace: true })
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail)
    setLoading(false)
    if (error) {
      toast.error(t('auth.loginError'))
    } else {
      toast.success(t('auth.resetPasswordSent'))
      setView('login')
      setForgotEmail('')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 shadow-lg">
          <ShoppingCart className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('app.name')}</h1>
      </div>

      {/* Setup banner */}
      {!isSupabaseConfigured && (
        <div className="mb-4 w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Setup required</p>
              <p className="mt-0.5">
                Copy <code className="rounded bg-amber-100 px-1">.env.example</code> →{' '}
                <code className="rounded bg-amber-100 px-1">.env.local</code> and add your Supabase
                URL + key to enable login.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        {/* Forgot password view */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">{t('auth.forgotPassword')}</h2>
            <p className="text-sm text-gray-500">{t('auth.resetPasswordHint')}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('auth.sendResetLink')}
            </button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full text-center text-sm text-brand-500 hover:underline"
            >
              {t('auth.backToLogin')}
            </button>
          </form>
        )}

        {/* Login / Register tabs */}
        {view !== 'forgot' && (
          <>
            <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
              {(['login', 'register'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                    view === v
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {v === 'login' ? t('auth.login') : t('auth.register')}
                </button>
              ))}
            </div>

            {/* Login Form */}
            {view === 'login' && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('auth.email')}
                  </label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="you@example.com"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">{t('validation.invalidEmail')}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('auth.password')}
                  </label>
                  <input
                    {...loginForm.register('password')}
                    type="password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <div className="mt-1 text-end">
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-brand-500 hover:underline"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('auth.login')}
                </button>
              </form>
            )}

            {/* Register Form */}
            {view === 'register' && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('auth.name')}
                  </label>
                  <input
                    {...registerForm.register('name')}
                    type="text"
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder={t('auth.name')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('auth.email')}
                  </label>
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('auth.password')}
                  </label>
                  <input
                    {...registerForm.register('password')}
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    {...registerForm.register('confirmPassword')}
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{t('validation.passwordsMismatch')}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('auth.register')}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
