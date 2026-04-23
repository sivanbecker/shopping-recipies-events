import { useState } from 'react'
import Avatar from 'boring-avatars'
import { cn } from '@/lib/utils'
import { PRESET_TO_AVATAR_VARIANT } from '@/lib/theme'
import { useAppStore } from '@/store/useAppStore'

interface UserAvatarProps {
  userId: string
  displayName?: string | null
  avatarUrl?: string | null
  size?: number
  ring?: boolean
  className?: string
}

export function UserAvatar({
  userId,
  displayName,
  avatarUrl,
  size = 40,
  ring = false,
  className,
}: UserAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = Boolean(avatarUrl) && !imgFailed
  const uiPreset = useAppStore(s => s.uiPreset)
  const avatarVariant = PRESET_TO_AVATAR_VARIANT[uiPreset]

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden rounded-full',
        ring && 'ring-2 ring-brand-500',
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={displayName ?? userId}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={displayName ?? ''}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Avatar name={userId} variant={avatarVariant as 'beam' | 'marble' | 'sunset'} size={size} />
      )}
    </div>
  )
}
