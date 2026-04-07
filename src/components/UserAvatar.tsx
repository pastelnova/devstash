import Image from 'next/image'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  image?: string | null
  size?: 'sm' | 'md'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserAvatar({ name, image, size = 'sm', className }: UserAvatarProps) {
  const sizeClasses = size === 'md' ? 'h-9 w-9 text-sm' : 'h-7 w-7 text-xs'

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? 'User avatar'}
        width={size === 'md' ? 36 : 28}
        height={size === 'md' ? 36 : 28}
        className={cn('rounded-full object-cover shrink-0', sizeClasses, className)}
      />
    )
  }

  const initials = name ? getInitials(name) : '?'

  return (
    <div
      className={cn(
        'rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shrink-0',
        sizeClasses,
        className
      )}
    >
      {initials}
    </div>
  )
}
