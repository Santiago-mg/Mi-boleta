import { axiosClient } from './axiosClient'

import type { ApiResponse } from '../types/api'
import type { AuthSession, LoginCredentials, RegisterPayload, User } from '../types/auth'

export async function login(payload: LoginCredentials): Promise<AuthSession> {
  const response = await axiosClient.post<ApiResponse<AuthSession>>('/auth/login', payload)

  return response.data.data
}

export async function register(payload: RegisterPayload): Promise<User> {
  const response = await axiosClient.post<ApiResponse<User>>('/auth/register', payload)

  return response.data.data
}
