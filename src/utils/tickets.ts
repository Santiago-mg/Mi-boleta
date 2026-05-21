import type { Ticket } from '../types/ticket'

export function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) {
    return 'Sin valor'
  }

  return new Intl.NumberFormat('es-CO', {
    currency: 'COP',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function toDateTimeLocalValue(value?: string) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)

  return localDate.toISOString().slice(0, 16)
}

export function daysUntil(value: string) {
  const today = new Date()
  const targetDate = new Date(value)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfTarget = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  )

  return Math.ceil((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000)
}

export function getTicketTimingLabel(ticket: Ticket) {
  const days = daysUntil(ticket.gameDate)

  if (days < 0) {
    return `Hace ${Math.abs(days)} dia(s)`
  }

  if (days === 0) {
    return 'Hoy'
  }

  if (days === 1) {
    return 'Manana'
  }

  return `En ${days} dias`
}

export function getTicketPriority(ticket: Ticket) {
  if (ticket.status !== 'Pendiente') {
    return {
      label: 'Seguimiento bajo',
      level: 'low',
      score: 0,
    } as const
  }

  const days = daysUntil(ticket.gameDate)
  const amountBoost = Math.min(Math.floor((ticket.amount ?? 0) / 50_000), 15)
  let score = 30 + amountBoost

  if (days <= 0) {
    score += 70
  } else if (days <= 2) {
    score += 55
  } else if (days <= 7) {
    score += 40
  } else if (days <= 30) {
    score += 20
  }

  if (score >= 85) {
    return {
      label: 'Prioridad critica',
      level: 'critical',
      score,
    } as const
  }

  if (score >= 65) {
    return {
      label: 'Prioridad alta',
      level: 'high',
      score,
    } as const
  }

  if (score >= 45) {
    return {
      label: 'Prioridad media',
      level: 'medium',
      score,
    } as const
  }

  return {
    label: 'Prioridad baja',
    level: 'low',
    score,
  } as const
}

export function getRadarTickets(tickets: Ticket[]) {
  return tickets
    .filter((ticket) => ticket.status === 'Pendiente')
    .map((ticket) => ({
      priority: getTicketPriority(ticket),
      ticket,
    }))
    .sort((first, second) => {
      if (second.priority.score !== first.priority.score) {
        return second.priority.score - first.priority.score
      }

      return new Date(first.ticket.gameDate).getTime() - new Date(second.ticket.gameDate).getTime()
    })
}

export function getUpcomingTickets(tickets: Ticket[]) {
  return tickets
    .filter((ticket) => ticket.status === 'Pendiente' && daysUntil(ticket.gameDate) >= 0)
    .sort((first, second) => {
      return new Date(first.gameDate).getTime() - new Date(second.gameDate).getTime()
    })
}

export function getRecentTickets(tickets: Ticket[]) {
  return [...tickets].sort((first, second) => {
    const firstDate = first.createdAt ?? first.updatedAt ?? first.gameDate
    const secondDate = second.createdAt ?? second.updatedAt ?? second.gameDate

    return new Date(secondDate).getTime() - new Date(firstDate).getTime()
  })
}
