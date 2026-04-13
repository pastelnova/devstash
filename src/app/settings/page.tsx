import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { hasPassword, getEditorPreferences } from '@/lib/db/profile'
import { getSystemItemTypes, getSearchItems } from '@/lib/db/items'
import { getSidebarCollections, getSearchCollections } from '@/lib/db/collections'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ChangePasswordSection } from '@/components/profile/ChangePasswordSection'
import { DeleteAccountSection } from '@/components/profile/DeleteAccountSection'
import { EditorPreferencesSection } from '@/components/settings/EditorPreferencesSection'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const userId = session.user.id

  const [canChangePassword, editorPreferences, itemTypes, sidebarCollections, searchItems, searchCollections] = await Promise.all([
    hasPassword(userId),
    getEditorPreferences(userId),
    getSystemItemTypes(userId),
    getSidebarCollections(userId),
    getSearchItems(userId),
    getSearchCollections(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} searchItems={searchItems} searchCollections={searchCollections} user={session.user} editorPreferences={editorPreferences}>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
        </div>

        <EditorPreferencesSection />

        {canChangePassword && <ChangePasswordSection />}

        <DeleteAccountSection />
      </div>
    </DashboardShell>
  )
}
