export type ApiResponse<TData, TMeta = unknown> = {
  data: TData
  meta?: TMeta
}

export type ApiErrorResponse = {
  error?: string
  message?: string
}

export type PaginationMeta = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PaginatedResponse<TItem> = ApiResponse<TItem[], PaginationMeta>
