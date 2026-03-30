import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FolderPlus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 w-60 shrink-0">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            S
          </div>
          <span className="font-semibold text-sm">DevStash</span>
        </div>
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-8 bg-muted border-0 h-8 text-sm"
              readOnly
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FolderPlus className="h-4 w-4" />
            New Collection
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Item
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-border shrink-0 p-4">
          <h2 className="text-lg font-semibold">Sidebar</h2>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-lg font-semibold">Main</h2>
        </main>
      </div>
    </div>
  );
}
