import Avatar from 'boring-avatars'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  userId: string
  displayName?: string | null
  size?: number
  ring?: boolean
  className?: string
}

export function UserAvatar({
  userId,
  displayName,
  size = 40,
  ring = false,
  className,
}: UserAvatarProps) {
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
      <Avatar name={userId} variant="beam" size={size} />
    </div>
  )
}
