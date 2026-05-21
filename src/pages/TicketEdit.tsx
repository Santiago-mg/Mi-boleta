import { useParams } from 'react-router-dom'

import { RoutePlaceholder } from '../components/RoutePlaceholder'

export function TicketEdit() {
  const { id } = useParams<{ id: string }>()

  return (
    <RoutePlaceholder
      title="Editar boleta"
      description={`Vista base para editar el ticket ${id ?? ''}. La carga y actualizacion se implementaran en el Tramo 9.`}
    />
  )
}
