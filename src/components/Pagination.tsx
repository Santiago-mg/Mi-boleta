import type { PaginationMeta } from '../types/api'

type PaginationProps = {
  meta?: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) {
    return null
  }

  const previousPage = Math.max(meta.page - 1, 1)
  const nextPage = Math.min(meta.page + 1, meta.totalPages)

  return (
    <nav className="pagination" aria-label="Paginacion">
      <button
        className="ghost-button"
        type="button"
        disabled={meta.page <= 1}
        onClick={() => onPageChange(previousPage)}
      >
        Anterior
      </button>

      <span>
        Pagina {meta.page} de {meta.totalPages}
      </span>

      <button
        className="ghost-button"
        type="button"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPageChange(nextPage)}
      >
        Siguiente
      </button>
    </nav>
  )
}
