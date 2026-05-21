import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { GAME_TYPES, TICKET_STATUSES } from '../types/ticket'
import type { CreateTicketPayload, Ticket } from '../types/ticket'
import { toDateTimeLocalValue } from '../utils/tickets'

const ticketSchema = z.object({
  title: z.string().min(1, 'El titulo es obligatorio.'),
  gameType: z.enum(GAME_TYPES, { message: 'Selecciona un tipo de juego.' }),
  gameNumber: z.string().optional(),
  gameDate: z
    .string()
    .min(1, 'La fecha del sorteo es obligatoria.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Ingresa una fecha valida.'),
  amount: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined
      }

      return Number(value)
    },
    z.number().positive('El valor debe ser un numero positivo.').optional(),
  ),
  place: z.string().optional(),
  status: z.enum(TICKET_STATUSES, { message: 'Selecciona un estado.' }),
  notes: z.string().optional(),
})

type TicketFormInput = z.input<typeof ticketSchema>
type TicketFormValues = z.output<typeof ticketSchema>

export type TicketSubmitPayload = CreateTicketPayload

type TicketFormProps = {
  initialTicket?: Ticket
  isSubmitting?: boolean
  submitLabel: string
  onSubmit: (payload: TicketSubmitPayload) => Promise<void> | void
}

function normalizeOptionalText(value?: string) {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : undefined
}

function buildDefaultValues(ticket?: Ticket): TicketFormInput {
  return {
    title: ticket?.title ?? '',
    gameType: ticket?.gameType ?? 'Lotería',
    gameNumber: ticket?.gameNumber ?? '',
    gameDate: toDateTimeLocalValue(ticket?.gameDate),
    amount: ticket?.amount ?? undefined,
    place: ticket?.place ?? '',
    status: ticket?.status ?? 'Pendiente',
    notes: ticket?.notes ?? '',
  }
}

export function TicketForm({
  initialTicket,
  isSubmitting = false,
  onSubmit,
  submitLabel,
}: TicketFormProps) {
  const {
    formState: { errors, isSubmitting: isFormSubmitting },
    handleSubmit,
    register,
  } = useForm<TicketFormInput, unknown, TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: buildDefaultValues(initialTicket),
  })

  async function handleValidSubmit(values: TicketFormValues) {
    await onSubmit({
      title: values.title.trim(),
      gameType: values.gameType,
      gameNumber: normalizeOptionalText(values.gameNumber),
      gameDate: new Date(values.gameDate).toISOString(),
      amount: values.amount,
      place: normalizeOptionalText(values.place),
      status: values.status,
      notes: normalizeOptionalText(values.notes),
    })
  }

  const disabled = isSubmitting || isFormSubmitting

  return (
    <form className="ticket-form" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
      <div className="form-grid">
        <div className="field-group">
          <label htmlFor="title">Nombre del sorteo</label>
          <input id="title" type="text" aria-invalid={Boolean(errors.title)} {...register('title')} />
          {errors.title ? <span className="field-error">{errors.title.message}</span> : null}
        </div>

        <div className="field-group">
          <label htmlFor="gameType">Tipo de juego</label>
          <select id="gameType" aria-invalid={Boolean(errors.gameType)} {...register('gameType')}>
            {GAME_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.gameType ? <span className="field-error">{errors.gameType.message}</span> : null}
        </div>

        <div className="field-group">
          <label htmlFor="gameNumber">Numero jugado</label>
          <input id="gameNumber" type="text" {...register('gameNumber')} />
        </div>

        <div className="field-group">
          <label htmlFor="gameDate">Fecha del sorteo</label>
          <input
            id="gameDate"
            type="datetime-local"
            aria-invalid={Boolean(errors.gameDate)}
            {...register('gameDate')}
          />
          {errors.gameDate ? <span className="field-error">{errors.gameDate.message}</span> : null}
        </div>

        <div className="field-group">
          <label htmlFor="amount">Valor apostado</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="100"
            aria-invalid={Boolean(errors.amount)}
            {...register('amount')}
          />
          {errors.amount ? <span className="field-error">{errors.amount.message}</span> : null}
        </div>

        <div className="field-group">
          <label htmlFor="status">Estado</label>
          <select id="status" aria-invalid={Boolean(errors.status)} {...register('status')}>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {errors.status ? <span className="field-error">{errors.status.message}</span> : null}
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="place">Lugar de compra</label>
        <input id="place" type="text" {...register('place')} />
      </div>

      <div className="field-group">
        <label htmlFor="notes">Notas</label>
        <textarea id="notes" rows={4} {...register('notes')} />
      </div>

      <div className="form-actions">
        <Link className="ghost-button" to="/tickets">
          Cancelar
        </Link>
        <button className="primary-button" type="submit" disabled={disabled}>
          <Save size={17} />
          {disabled ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
