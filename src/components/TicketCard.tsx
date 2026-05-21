import { CalendarDays, MapPin, Pencil, Trash2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { Ticket } from '../types/ticket'
import {
  formatCurrency,
  formatDateTime,
  getTicketPriority,
  getTicketTimingLabel,
} from '../utils/tickets'

type TicketCardProps = {
  ticket: Ticket
  onDelete?: (ticket: Ticket) => void
  showOwner?: boolean
}

export function TicketCard({ onDelete, showOwner = false, ticket }: TicketCardProps) {
  const priority = getTicketPriority(ticket)

  return (
    <article className="ticket-card">
      <div className="ticket-card-header">
        <div>
          <span className={`status-pill status-${ticket.status.toLowerCase()}`}>
            {ticket.status}
          </span>
          <h3>{ticket.title}</h3>
        </div>
        <span className={`priority-chip priority-${priority.level}`}>{priority.label}</span>
      </div>

      <dl className="ticket-details">
        <div>
          <dt>Tipo</dt>
          <dd>{ticket.gameType}</dd>
        </div>
        <div>
          <dt>Numero</dt>
          <dd>{ticket.gameNumber || 'Sin numero'}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{formatCurrency(ticket.amount)}</dd>
        </div>
      </dl>

      <div className="ticket-meta">
        <span>
          <CalendarDays size={16} />
          {formatDateTime(ticket.gameDate)} · {getTicketTimingLabel(ticket)}
        </span>
        {ticket.place ? (
          <span>
            <MapPin size={16} />
            {ticket.place}
          </span>
        ) : null}
        {showOwner && ticket.owner ? (
          <span>
            <UserRound size={16} />
            {ticket.owner.name} · {ticket.owner.email}
          </span>
        ) : null}
      </div>

      {ticket.notes ? <p className="ticket-notes">{ticket.notes}</p> : null}

      {onDelete ? (
        <div className="ticket-actions">
          <Link className="ghost-button" to={`/tickets/${ticket.id}/edit`}>
            <Pencil size={16} />
            Editar
          </Link>
          <button className="danger-button" type="button" onClick={() => onDelete(ticket)}>
            <Trash2 size={16} />
            Eliminar
          </button>
        </div>
      ) : null}
    </article>
  )
}
