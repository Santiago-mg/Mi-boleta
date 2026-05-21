import type { AuthSession, User } from '../types/auth'

export const AUTH_STORAGE_KEYS = {
  token: 'mi-boleta:token',
  user: 'mi-boleta:user',
} as const

export const AUTH_UNAUTHORIZED_EVENT = 'mi-boleta:unauthorized'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getStoredToken(): string | null {
  if (!canUseStorage()) {
    return null
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEYS.token)
}

export function getStoredUser(): User | null {
  if (!canUseStorage()) {
    return null
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEYS.user)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as User
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.user)
    return null
  }
}

export function saveStoredAuth(session: AuthSession) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEYS.token, session.token)
  window.localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(session.user))
}

export function clearStoredAuth() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEYS.token)
  window.localStorage.removeItem(AUTH_STORAGE_KEYS.user)
}
