import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { UpgradeContent } from '@/components/upgrade/UpgradeContent'

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  if (session.user.isPro) redirect('/dashboard')

  return <UpgradeContent />
}
