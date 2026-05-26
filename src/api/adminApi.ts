import { axiosClient } from './axiosClient'

import type { AxiosRequestConfig } from 'axios'
import type { PaginatedResponse } from '../types/api'
import type { AdminTicketFilters, Ticket } from '../types/ticket'

type RequestOptions = Pick<AxiosRequestConfig, 'signal'>

export async function getAdminTickets(
  filters: AdminTicketFilters = {},
  options: RequestOptions = {},
): Promise<PaginatedResponse<Ticket>> {
  const response = await axiosClient.get<PaginatedResponse<Ticket>>('/admin/tickets', {
    params: filters,
    signal: options.signal,
  })

  return response.data
}
