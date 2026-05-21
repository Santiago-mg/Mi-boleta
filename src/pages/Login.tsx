import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { getApiErrorMessage } from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'

const loginSchema = z.object({
  email: z.string().min(1, 'El email es obligatorio.').email('Ingresa un email valido.'),
  password: z.string().min(1, 'La contrasena es obligatoria.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginLocationState = {
  from?: {
    pathname?: string
  }
  registeredEmail?: string
  registrationMessage?: string
}

function getLocationState(state: unknown) {
  const locationState = state as LoginLocationState | null

  return locationState
}

export function Login() {
  const { isAuthenticated, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const locationState = getLocationState(location.state)
  const redirectPath = locationState?.from?.pathname ?? '/dashboard'

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: locationState?.registeredEmail ?? '',
      password: '',
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)

    try {
      await login(values)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No pudimos iniciar sesion. Revisa tus datos.'))
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Mi Boleta</p>
          <h1 id="login-title">Iniciar sesion</h1>
          <p className="auth-copy">
            Accede para gestionar tus boletas, sorteos y resultados en un solo lugar.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </div>

          <div className="field-group">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? (
              <span className="field-error">{errors.password.message}</span>
            ) : null}
          </div>

          {formError ? <p className="form-error">{formError}</p> : null}

          {locationState?.registrationMessage ? (
            <p className="form-success">{locationState.registrationMessage}</p>
          ) : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </section>
    </main>
  )
}
