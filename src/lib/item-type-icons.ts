import { Code2, Sparkles, Terminal, StickyNote, File, Image, Link as LinkIcon } from 'lucide-react'

// Maps DB icon names (stored in ItemType.icon) to Lucide components
export const typeIconMap: Record<string, React.ElementType> = {
  Code: Code2,
  Sparkles: Sparkles,
  Terminal: Terminal,
  StickyNote: StickyNote,
  File: File,
  Image: Image,
  Link: LinkIcon,
}
