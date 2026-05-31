import { CalendarClock, CircleCheckBig, CircleX, Plus, Radar, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminTickets } from '../api/adminApi'
import { getApiErrorMessage } from '../api/axiosClient'
import { getTickets } from '../api/ticketsApi'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import type { Ticket as TicketType } from '../types/ticket'
import {
  formatCurrency,
  formatDateOnly,
  getRadarTickets,
  getRecentTickets,
  getTicketTimingLabel,
  getUpcomingTickets,
} from '../utils/tickets'

async function fetchAllTickets(signal?: AbortSignal, isAdmin = false) {
  const apiCall = isAdmin ? getAdminTickets : getTickets
  
  if (!isAdmin) {
    // Non-admin: load user tickets only
    const firstPage = await apiCall({ page: 1, pageSize: 100 }, { signal })
    const totalPages = firstPage.meta?.totalPages ?? 1
    const tickets = [...firstPage.data]
    for (let page = 2; page <= totalPages; page++) {
      const next = await apiCall({ page, pageSize: 100 }, { signal })
      tickets.push(...next.data)
    }
    return tickets
  }

  // Admin: load 2000 records in parallel
  const pageRequests = []
  for (let page = 1; page <= 20; page++) {
    pageRequests.push(apiCall({ page, pageSize: 100 }, { signal }))
  }
  
  const results = await Promise.all(pageRequests)
  const tickets: typeof results[0]['data'] = []
  for (const result of results) {
    tickets.push(...result.data)
  }
  
  return tickets.slice(0, 2000)
}

export function Dashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboard(signal?: AbortSignal) {
    setIsLoading(true)
    setError(null)

    try {
      const isAdmin = user?.role === 'admin'
      const nextTickets = await fetchAllTickets(signal, isAdmin)

      if (signal?.aborted) {
        return
      }

      setTickets(nextTickets)
    } catch (requestError) {
      if (signal?.aborted) {
        return
      }

      setError(getApiErrorMessage(requestError, 'No pudimos cargar el dashboard.'))
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    void loadDashboard(controller.signal)

    return () => {
      controller.abort()
    }
  }, [user?.role])

  const summary = useMemo(() => {
    const pending = tickets.filter((ticket) => ticket.status === 'Pendiente')
    const won = tickets.filter((ticket) => ticket.status === 'Ganado')
    const lost = tickets.filter((ticket) => ticket.status === 'Perdido')
    const radar = getRadarTickets(tickets)
    const upcoming = getUpcomingTickets(tickets).slice(0, 4)
    const recent = getRecentTickets(tickets).slice(0, 5)
    const trackedAmount = pending.reduce((total, ticket) => total + (ticket.amount ?? 0), 0)

    return {
      pending,
      won,
      lost,
      radar,
      upcoming,
      recent,
      trackedAmount,
      total: tickets.length,
    }
  }, [tickets])

  if (isLoading) {
    return <Loading label="Preparando tu resumen..." />
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboard} />
  }

  return (
    <main className="page-shell">
      <section className="page-header dashboard-hero">
        <div>
          <span className="section-kicker">Panel principal</span>
          <h1>Tu mapa de boletas</h1>
          <p>
            Revisa el estado de tus juegos, detecta sorteos cercanos y decide que boleta merece
            atencion primero.
          </p>
        </div>

        <Link className="primary-button" to="/tickets/new">
          <Plus size={18} />
          Nueva boleta
        </Link>
      </section>

      <section className="stats-grid" aria-label="Resumen de tickets">
        <article className="stat-card">
          <Ticket size={22} />
          <span>Total registrados</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="stat-card">
          <CalendarClock size={22} />
          <span>Pendientes</span>
          <strong>{summary.pending.length}</strong>
        </article>
        <article className="stat-card">
          <CircleCheckBig size={22} />
          <span>Ganados</span>
          <strong>{summary.won.length}</strong>
        </article>
        <article className="stat-card">
          <CircleX size={22} />
          <span>Perdidos</span>
          <strong>{summary.lost.length}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="radar-panel">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Funcionalidad diferencial</span>
              <h2>
                <Radar size={22} />
                Radar de Sorteos
              </h2>
            </div>
            <span className="amount-badge">{formatCurrency(summary.trackedAmount)} en juego</span>
          </div>

          {summary.radar.length > 0 ? (
            <div className="radar-list">
              {summary.radar.slice(0, 4).map(({ priority, ticket }) => (
                <Link className="radar-item" key={ticket.id} to={`/tickets/${ticket.id}/edit`}>
                  <div>
                    <strong>{ticket.title}</strong>
                    <span>
                      {getTicketTimingLabel(ticket)} · {ticket.gameNumber || 'sin numero'}
                    </span>
                  </div>
                  <div className="radar-score">
                    <span>{priority.score}</span>
                    <div>
                      <i style={{ width: `${Math.min(priority.score, 100)}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-copy">No tienes boletas pendientes para priorizar.</p>
          )}
        </article>

        <article className="content-panel">
          <div className="section-title-row">
            <div>
              <span className="section-kicker">Agenda</span>
              <h2>Proximos sorteos</h2>
            </div>
          </div>

          {summary.upcoming.length > 0 ? (
            <ul className="compact-list">
              {summary.upcoming.map((ticket) => (
                <li key={ticket.id}>
                  <div>
                    <strong>{ticket.title}</strong>
                    <span>{ticket.gameType}</span>
                  </div>
                  <time dateTime={ticket.gameDate}>{formatDateOnly(ticket.gameDate)}</time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">No hay sorteos pendientes en agenda.</p>
          )}
        </article>
      </section>

      <section className="content-panel">
        <div className="section-title-row">
          <div>
            <span className="section-kicker">Actividad</span>
            <h2>Tickets recientes</h2>
          </div>
          <Link className="ghost-button" to="/tickets">
            Ver todos
          </Link>
        </div>

        {summary.recent.length > 0 ? (
          <ul className="recent-list">
            {summary.recent.map((ticket) => (
              <li key={ticket.id}>
                <span className={`status-dot status-${ticket.status.toLowerCase()}`} />
                <div>
                  <strong>{ticket.title}</strong>
                  <span>
                    {ticket.status} · {ticket.gameType} · {formatCurrency(ticket.amount)}
                  </span>
                </div>
                <time dateTime={ticket.gameDate}>{formatDateOnly(ticket.gameDate)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-copy">Aun no tienes tickets registrados.</p>
        )}
      </section>
    </main>
  )
}
