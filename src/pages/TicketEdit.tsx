import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'

import { getApiErrorMessage } from '../api/axiosClient'
import { getTicketById, updateTicket } from '../api/ticketsApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { TicketForm } from '../components/TicketForm'
import type { TicketSubmitPayload } from '../components/TicketForm'
import type { Ticket } from '../types/ticket'

export function TicketEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadTicket(signal?: AbortSignal) {
    if (!id) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getTicketById(id, { signal })

      if (signal?.aborted) {
        return
      }

      setTicket(response)
    } catch (requestError) {
      if (signal?.aborted) {
        return
      }

      setError(getApiErrorMessage(requestError, 'No pudimos cargar la boleta.'))
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    void loadTicket(controller.signal)

    return () => {
      controller.abort()
    }
  }, [id])

  async function handleUpdate(payload: TicketSubmitPayload) {
    if (!id) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateTicket(id, payload)
      navigate('/tickets', { replace: true })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No pudimos actualizar la boleta.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!id) {
    return <Navigate to="/tickets" replace />
  }

  if (isLoading) {
    return <Loading label="Cargando boleta..." />
  }

  return (
    <main className="page-shell narrow-page">
      <section className="page-header">
        <div>
          <span className="section-kicker">Edicion</span>
          <h1>Editar boleta</h1>
          <p>Actualiza los datos, el estado o las notas de seguimiento.</p>
        </div>
      </section>

      {error ? <ErrorMessage message={error} onRetry={loadTicket} /> : null}

      {ticket ? (
        <section className="content-panel">
          <TicketForm
            initialTicket={ticket}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdate}
            submitLabel="Guardar cambios"
          />
        </section>
      ) : null}
    </main>
  )
}
