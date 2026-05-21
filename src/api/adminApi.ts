import { axiosClient } from './axiosClient'

import type { PaginatedResponse } from '../types/api'
import type { AdminTicketFilters, Ticket } from '../types/ticket'

export async function getAdminTickets(
  filters: AdminTicketFilters = {},
): Promise<PaginatedResponse<Ticket>> {
  const response = await axiosClient.get<PaginatedResponse<Ticket>>('/admin/tickets', {
    params: filters,
  })

  return response.data
}
