export const GAME_TYPES = [
  'Lotería',
  'Rifa',
  'Sorteo',
  'Boleta',
  'Juego ocasional',
] as const

export const TICKET_STATUSES = ['Pendiente', 'Ganado', 'Perdido'] as const

export type GameType = (typeof GAME_TYPES)[number]

export type TicketStatus = (typeof TICKET_STATUSES)[number]

export type TicketOwner = {
  id: string
  name: string
  email: string
}

export type Ticket = {
  id: string
  title: string
  gameType: GameType
  gameNumber?: string | null
  gameDate: string
  amount?: number | null
  place?: string | null
  status: TicketStatus
  notes?: string | null
  userId?: string
  owner?: TicketOwner
  createdAt?: string
  updatedAt?: string
}

export type CreateTicketPayload = {
  title: string
  gameType: GameType
  gameNumber?: string
  gameDate: string
  amount?: number
  place?: string
  status: TicketStatus
  notes?: string
}

export type UpdateTicketPayload = Partial<CreateTicketPayload>

export type TicketFilters = {
  status?: TicketStatus
  gameType?: GameType
  q?: string
  page?: number
  pageSize?: number
}

export type AdminTicketFilters = TicketFilters & {
  userId?: string
}
