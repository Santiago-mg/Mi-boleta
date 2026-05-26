import axios from 'axios'

import type { ApiErrorResponse } from '../types/api'
import { AUTH_UNAUTHORIZED_EVENT, clearStoredAuth, getStoredToken } from './authStorage'

const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? 'https://mi-boleta-api-y9dv.onrender.com/api/v1'

export const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

axiosClient.interceptors.request.use((config) => {
  const token = getStoredToken()

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredAuth()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))

        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      }
    }

    return Promise.reject(error)
  },
)

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrio un error inesperado. Intentalo de nuevo.',
) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'La API tardo demasiado en responder. Intentalo de nuevo.'
    }

    if (error.code === 'ERR_NETWORK') {
      return 'No pudimos conectar con la API. Revisa tu conexion e intentalo de nuevo.'
    }

    return (
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      fallback
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
