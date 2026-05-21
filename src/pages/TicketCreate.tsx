import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '../api/axiosClient'
import { createTicket } from '../api/ticketsApi'
import { ErrorMessage } from '../components/ErrorMessage'
import { TicketForm } from '../components/TicketForm'
import type { TicketSubmitPayload } from '../components/TicketForm'

export function TicketCreate() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(payload: TicketSubmitPayload) {
    setIsSubmitting(true)
    setError(null)

    try {
      await createTicket(payload)
      navigate('/tickets', { replace: true })
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'No pudimos crear la boleta.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-shell narrow-page">
      <section className="page-header">
        <div>
          <span className="section-kicker">Nuevo registro</span>
          <h1>Nueva boleta</h1>
          <p>Guarda la informacion clave para no perder de vista el sorteo.</p>
        </div>
      </section>

      {error ? <ErrorMessage message={error} /> : null}

      <section className="content-panel">
        <TicketForm
          isSubmitting={isSubmitting}
          onSubmit={handleCreate}
          submitLabel="Crear boleta"
        />
      </section>
    </main>
  )
}
