import { Filter, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { getAdminTickets } from '../api/adminApi'
import { getApiErrorMessage } from '../api/axiosClient'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { Pagination } from '../components/Pagination'
import { TicketCard } from '../components/TicketCard'
import type { PaginationMeta } from '../types/api'
import { GAME_TYPES, TICKET_STATUSES } from '../types/ticket'
import type { AdminTicketFilters, GameType, Ticket, TicketStatus } from '../types/ticket'

type AdminFilterState = {
  q: string
  status: '' | TicketStatus
  gameType: '' | GameType
  userId: string
  pageSize: number
}

const defaultFilters: AdminFilterState = {
  q: '',
  status: '',
  gameType: '',
  userId: '',
  pageSize: 10,
}

function buildAdminFilters(filters: AdminFilterState, page: number): AdminTicketFilters {
  return {
    page,
    pageSize: filters.pageSize,
    q: filters.q.trim() || undefined,
    status: filters.status || undefined,
    gameType: filters.gameType || undefined,
    userId: filters.userId.trim() || undefined,
  }
}

export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [meta, setMeta] = useState<PaginationMeta | undefined>()
  const [draftFilters, setDraftFilters] = useState<AdminFilterState>(defaultFilters)
  const [activeFilters, setActiveFilters] = useState<AdminFilterState>(defaultFilters)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadTickets() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getAdminTickets(buildAdminFilters(activeFilters, page))
      setTickets(response.data)
      setMeta(response.meta)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No pudimos cargar los tickets de administracion.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [activeFilters, page])

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setActiveFilters(draftFilters)
  }

  function handleResetFilters() {
    setDraftFilters(defaultFilters)
    setActiveFilters(defaultFilters)
    setPage(1)
  }

  return (
    <main className="page-shell">
      <section className="page-header admin-header">
        <div>
          <span className="section-kicker">Administracion</span>
          <h1>
            <ShieldCheck size={34} />
            Tickets globales
          </h1>
          <p>Consulta todos los tickets, filtra por estado, tipo, usuario o busqueda general.</p>
        </div>
      </section>

      <form className="filters-panel admin-filters" onSubmit={handleApplyFilters}>
        <div className="field-group search-field">
          <label htmlFor="admin-q">Busqueda</label>
          <div className="input-with-icon">
            <Search size={18} />
            <input
              id="admin-q"
              type="search"
              placeholder="Numero, titulo, nombre o email"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, q: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="admin-status">Estado</label>
          <select
            id="admin-status"
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value as AdminFilterState['status'],
              }))
            }
          >
            <option value="">Todos</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="admin-game-type">Tipo</label>
          <select
            id="admin-game-type"
            value={draftFilters.gameType}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                gameType: event.target.value as AdminFilterState['gameType'],
              }))
            }
          >
            <option value="">Todos</option>
            {GAME_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor="admin-user-id">User ID</label>
          <input
            id="admin-user-id"
            type="text"
            placeholder="UUID opcional"
            value={draftFilters.userId}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, userId: event.target.value }))
            }
          />
        </div>

        <div className="field-group">
          <label htmlFor="admin-page-size">Por pagina</label>
          <select
            id="admin-page-size"
            value={draftFilters.pageSize}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                pageSize: Number(event.target.value),
              }))
            }
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="filter-actions">
          <button className="primary-button" type="submit">
            <Filter size={17} />
            Filtrar
          </button>
          <button className="ghost-button" type="button" onClick={handleResetFilters}>
            Limpiar
          </button>
        </div>
      </form>

      {error ? <ErrorMessage message={error} onRetry={loadTickets} /> : null}

      {isLoading ? (
        <Loading label="Cargando panel admin..." />
      ) : tickets.length > 0 ? (
        <>
          <section className="tickets-grid" aria-label="Tickets de todos los usuarios">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} showOwner ticket={ticket} />
            ))}
          </section>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      ) : (
        <section className="empty-state">
          <h2>No hay resultados</h2>
          <p>No encontramos tickets con los filtros actuales.</p>
        </section>
      )}
    </main>
  )
}
