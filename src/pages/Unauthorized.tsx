import { RoutePlaceholder } from '../components/RoutePlaceholder'

export function Unauthorized() {
  return (
    <RoutePlaceholder
      title="No autorizado"
      description="Esta vista se usara cuando un usuario autenticado no tenga permisos suficientes."
    />
  )
}
