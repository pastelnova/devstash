import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  baseUrl: string
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('ellipsis')
  }

  pages.push(total)

  return pages
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  function pageUrl(page: number): string {
    return page === 1 ? baseUrl : `${baseUrl}?page=${page}`
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      {currentPage === 1 ? (
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground/40 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={pageUrl(currentPage - 1)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {pages.map((page, i) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center h-9 w-9 text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            aria-current="page"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={pageUrl(page)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {page}
          </Link>
        ),
      )}

      {currentPage === totalPages ? (
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground/40 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link
          href={pageUrl(currentPage + 1)}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  )
}
