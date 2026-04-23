import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, HelpCircle, Mail, Bug, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { UserAvatar } from '@/components/UserAvatar'

export function ProfileDropdown() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  async function handleSignOut() {
    await signOut()
    navigate('/auth', { replace: true })
  }

  const itemClass =
    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-200 cursor-pointer outline-none select-none ' +
    'data-[highlighted]:bg-gray-100 data-[highlighted]:dark:bg-gray-800 ' +
    'data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="rounded-full p-0.5 transition hover:ring-2 hover:ring-brand-500 outline-none"
          aria-label="Profile menu"
        >
          <UserAvatar
            userId={user.id}
            displayName={profile?.display_name}
            avatarUrl={profile?.avatar_url}
            size={32}
            ring
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-1 outline-none"
        >
          {/* User info header */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
            <UserAvatar
              userId={user.id}
              displayName={profile?.display_name}
              avatarUrl={profile?.avatar_url}
              size={40}
              ring
            />
            <div className="flex flex-col min-w-0">
              {profile?.display_name && (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {profile.display_name}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </span>
            </div>
          </div>

          <DropdownMenu.Item className={itemClass} onSelect={() => navigate('/profile')}>
            <User className="h-4 w-4 shrink-0" />
            {t('header.myProfile')}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="border-t border-gray-100 dark:border-gray-800 my-1" />

          <DropdownMenu.Item className={itemClass} disabled>
            <HelpCircle className="h-4 w-4 shrink-0" />
            {t('header.faq')}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={itemClass}
            onSelect={() => {
              window.location.href = 'mailto:shopcookhost@gmail.com'
            }}
          >
            <Mail className="h-4 w-4 shrink-0" />
            {t('header.contactSupport')}
          </DropdownMenu.Item>

          <DropdownMenu.Item className={itemClass} disabled>
            <Bug className="h-4 w-4 shrink-0" />
            {t('header.reportBug')}
          </DropdownMenu.Item>

          <DropdownMenu.Item className={itemClass} disabled>
            <MessageSquare className="h-4 w-4 shrink-0" />
            {t('header.giveFeedback')}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="border-t border-gray-100 dark:border-gray-800 my-1" />

          <DropdownMenu.Item
            className={`${itemClass} text-red-500 dark:text-red-400`}
            onSelect={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t('auth.logout')}
          </DropdownMenu.Item>

          <div className="px-3 pt-1 pb-1.5 text-center text-xs text-gray-400 dark:text-gray-600">
            v{__APP_VERSION__}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
