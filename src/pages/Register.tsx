import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { register as registerUser } from '../api/authApi'
import { getApiErrorMessage } from '../api/axiosClient'
import { useAuth } from '../context/AuthContext'

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio.')
    .max(80, 'El nombre no puede superar 80 caracteres.'),
  email: z.string().min(1, 'El email es obligatorio.').email('Ingresa un email valido.'),
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria.')
    .min(8, 'La contrasena debe tener al menos 8 caracteres.'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export function Register() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null)

    try {
      await registerUser(values)
      navigate('/login', {
        replace: true,
        state: {
          registeredEmail: values.email,
          registrationMessage: 'Cuenta creada correctamente. Ahora puedes iniciar sesion.',
        },
      })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'No pudimos crear la cuenta. Intentalo de nuevo.'))
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div>
          <p className="eyebrow">Mi Boleta</p>
          <h1 id="register-title">Crear cuenta</h1>
          <p className="auth-copy">
            Registra tu usuario para empezar a guardar tus boletas y sorteos.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field-group">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name ? <span className="field-error">{errors.name.message}</span> : null}
          </div>

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
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            {errors.password ? (
              <span className="field-error">{errors.password.message}</span>
            ) : null}
          </div>

          {formError ? <p className="form-error">{formError}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </section>
    </main>
  )
}
