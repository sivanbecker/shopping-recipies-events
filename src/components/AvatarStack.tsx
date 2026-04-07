import { UserAvatar } from './UserAvatar'

interface Member {
  user_id: string
  display_name: string | null
  role: string
}

interface AvatarStackProps {
  members: Member[]
  size?: number
  max?: number
  className?: string
}

export function AvatarStack({ members, size = 28, max = 3, className }: AvatarStackProps) {
  if (!members || members.length === 0) {
    return null
  }

  // Sort so owner always comes first
  const sorted = [...members].sort((a, b) => {
    if (a.role === 'owner') return -1
    if (b.role === 'owner') return 1
    return 0
  })

  const visible = sorted.slice(0, max)
  const hidden = sorted.length - visible.length

  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <div className="flex" style={{ marginRight: `${size * 0.15}px` }}>
        {visible.map((member, index) => (
          <div
            key={member.user_id}
            style={{
              marginLeft: index === 0 ? 0 : `${-size * 0.35}px`,
              zIndex: visible.length - index,
            }}
          >
            <UserAvatar
              userId={member.user_id}
              displayName={member.display_name}
              size={size}
              ring={member.role === 'owner'}
            />
          </div>
        ))}
      </div>

      {hidden > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700 shrink-0"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
          title={`+${hidden} more`}
        >
          +{hidden}
        </div>
      )}
    </div>
  )
}
