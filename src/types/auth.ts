export const USER_ROLES = ['user', 'admin'] as const

export type UserRole = (typeof USER_ROLES)[number]

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt?: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
}

export type AuthSession = {
  token: string
  user: User
}
