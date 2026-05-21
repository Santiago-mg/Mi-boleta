import { axiosClient } from './axiosClient'

import type { ApiResponse, PaginatedResponse } from '../types/api'
import type {
  CreateTicketPayload,
  Ticket,
  TicketFilters,
  UpdateTicketPayload,
} from '../types/ticket'

export async function getTickets(filters: TicketFilters = {}): Promise<PaginatedResponse<Ticket>> {
  const response = await axiosClient.get<PaginatedResponse<Ticket>>('/tickets', {
    params: filters,
  })

  return response.data
}

export async function getTicketById(id: string): Promise<Ticket> {
  const response = await axiosClient.get<ApiResponse<Ticket>>(`/tickets/${id}`)

  return response.data.data
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const response = await axiosClient.post<ApiResponse<Ticket>>('/tickets', payload)

  return response.data.data
}

export async function updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
  const response = await axiosClient.put<ApiResponse<Ticket>>(`/tickets/${id}`, payload)

  return response.data.data
}

export async function deleteTicket(id: string): Promise<void> {
  await axiosClient.delete(`/tickets/${id}`)
}
