import { useState } from 'react'
import Avatar from 'boring-avatars'
import { cn } from '@/lib/utils'

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
        <Avatar name={userId} variant="beam" size={size} />
      )}
    </div>
  )
}
