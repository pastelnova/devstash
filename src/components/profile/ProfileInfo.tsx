import { UserAvatar } from '@/components/UserAvatar'
import { Card, CardContent } from '@/components/ui/card'

interface ProfileInfoProps {
  name: string | null
  email: string
  image: string | null
  createdAt: Date
}

export function ProfileInfo({ name, email, image, createdAt }: ProfileInfoProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <UserAvatar name={name} image={image} size="lg" />
        <div className="space-y-1">
          {name && <p className="text-lg font-medium">{name}</p>}
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="text-xs text-muted-foreground">
            Joined {createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
