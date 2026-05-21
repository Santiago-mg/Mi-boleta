import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { login as loginRequest } from '../api/authApi'
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  saveStoredAuth,
} from '../api/authStorage'
import type { AuthSession, LoginCredentials, User } from '../types/auth'

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getInitialSession(): AuthSession | null {
  const token = getStoredToken()
  const user = getStoredUser()

  if (!token || !user) {
    return null
  }

  return { token, user }
}

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(() => getInitialSession())

  const logout = useCallback(() => {
    clearStoredAuth()
    setSession(null)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const nextSession = await loginRequest(credentials)

    saveStoredAuth(nextSession)
    setSession(nextSession)
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, logout)

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, logout)
    }
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session?.token && session?.user),
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.')
  }

  return context
}
