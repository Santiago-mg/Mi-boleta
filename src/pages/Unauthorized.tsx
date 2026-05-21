import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Unauthorized() {
  return (
    <main className="page-shell narrow-page">
      <section className="empty-state unauthorized-state">
        <ShieldAlert size={42} />
        <h1>No autorizado</h1>
        <p>No tienes permisos de administrador para ver esta seccion.</p>
        <Link className="primary-button" to="/dashboard">
          Volver al dashboard
        </Link>
      </section>
    </main>
  )
}
