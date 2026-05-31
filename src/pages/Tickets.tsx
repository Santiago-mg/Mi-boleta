import { Filter, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { getAdminTickets } from '../api/adminApi'
import { getApiErrorMessage } from '../api/axiosClient'
import { deleteTicket, getTickets } from '../api/ticketsApi'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { Pagination } from '../components/Pagination'
import { TicketCard } from '../components/TicketCard'
import { useToast } from '../context/ToastContext'
import type { PaginationMeta } from '../types/api'
import { GAME_TYPES, TICKET_STATUSES } from '../types/ticket'
import type { GameType, Ticket, TicketFilters, TicketStatus } from '../types/ticket'

type FilterState = {
  q: string
  status: '' | TicketStatus
  gameType: '' | GameType
  pageSize: number
}

const defaultFilters: FilterState = {
  q: '',
  status: '',
  gameType: '',
  pageSize: 10,
}

function buildTicketFilters(filters: FilterState, page: number): TicketFilters {
  return {
    page,
    pageSize: filters.pageSize,
    q: filters.q.trim() || undefined,
    status: filters.status || undefined,
    gameType: filters.gameType || undefined,
  }
}

export function Tickets() {
  const { user } = useAuth()
  const toast = useToast()
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [meta, setMeta] = useState<PaginationMeta | undefined>()
  const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters)
  const [activeFilters, setActiveFilters] = useState<FilterState>(defaultFilters)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadTickets(signal?: AbortSignal) {
    setIsLoading(true)
    setError(null)

    try {
      let allData: Ticket[] = []

      // If admin, load 2000 records in parallel
      if (user?.role === 'admin') {
        const pageRequests = []
        for (let p = 1; p <= 20; p++) {
          pageRequests.push(getAdminTickets({ page: p, pageSize: 100 }, { signal }))
        }
        const results = await Promise.all(pageRequests)
        for (const result of results) {
          allData.push(...result.data)
        }
        allData = allData.slice(0, 2000)
      } else {
        // Non-admin: load user tickets normally
        const response = await getTickets(buildTicketFilters(activeFilters, page), { signal })
        allData = response.data
        setMeta(response.meta)
      }

      if (signal?.aborted) {
        return
      }

      setAllTickets(allData)
      
      // Apply pagination for admin
      if (user?.role === 'admin') {
        const pageSize = activeFilters.pageSize
        const pageNumber = page
        const startIndex = (pageNumber - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedData = allData.slice(startIndex, endIndex)
        
        setTickets(paginatedData)
        setMeta({
          page: pageNumber,
          pageSize,
          total: allData.length,
          totalPages: Math.ceil(allData.length / pageSize),
        })
      } else {
        setTickets(allData)
      }
    } catch (requestError) {
      if (signal?.aborted) {
        return
      }

      setError(getApiErrorMessage(requestError, 'No pudimos cargar tus tickets.'))
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    void loadTickets(controller.signal)

    return () => {
      controller.abort()
    }
  }, [user?.role, activeFilters, page])

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

  async function handleDelete(ticket: Ticket) {
    const shouldDelete = window.confirm(`Eliminar "${ticket.title}"? Esta accion no se puede deshacer.`)

    if (!shouldDelete) {
      return
    }

    setDeletingId(ticket.id)
    setError(null)

    try {
      await deleteTicket(ticket.id)
      toast.success(`"${ticket.title}" eliminada correctamente.`)

      if (tickets.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      } else {
        await loadTickets()
      }
    } catch (requestError) {
      const msg = getApiErrorMessage(requestError, 'No pudimos eliminar el ticket.')
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="page-shell">
      <section className="page-header">
        <div>
          <span className="section-kicker">Historial</span>
          <h1>{user?.role === 'admin' ? 'Todos los tickets' : 'Mis tickets'}</h1>
          <p>{user?.role === 'admin' ? 'Consulta los 2000 tickets más recientes del sistema.' : 'Busca, filtra y administra todas tus boletas registradas.'}</p>
        </div>

        {user?.role !== 'admin' && (
          <Link className="primary-button" to="/tickets/new">
            <Plus size={18} />
            Nueva boleta
          </Link>
        )}
      </section>

      <form className="filters-panel" onSubmit={handleApplyFilters}>
        <div className="field-group search-field">
          <label htmlFor="q">Busqueda</label>
          <div className="input-with-icon">
            <Search size={18} />
            <input
              id="q"
              type="search"
              placeholder="Titulo o numero"
              value={draftFilters.q}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, q: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="status">Estado</label>
          <select
            id="status"
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value as FilterState['status'],
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
          <label htmlFor="gameType">Tipo</label>
          <select
            id="gameType"
            value={draftFilters.gameType}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                gameType: event.target.value as FilterState['gameType'],
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
          <label htmlFor="pageSize">Por pagina</label>
          <select
            id="pageSize"
            value={draftFilters.pageSize}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                pageSize: Number(event.target.value),
              }))
            }
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
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
        <Loading label="Cargando tickets..." />
      ) : tickets.length > 0 ? (
        <>
          {deletingId ? <p className="inline-status">Eliminando ticket...</p> : null}
          <section className="tickets-grid" aria-label="Lista de tickets">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onDelete={handleDelete} />
            ))}
          </section>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      ) : (
        <section className="empty-state">
          <h2>No hay tickets con estos filtros</h2>
          <p>Prueba limpiando los filtros o registra una nueva boleta.</p>
          <Link className="primary-button" to="/tickets/new">
            <Plus size={18} />
            Crear boleta
          </Link>
        </section>
      )}
    </main>
  )
}
