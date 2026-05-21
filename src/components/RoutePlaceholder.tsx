import { Link } from 'react-router-dom'

type RoutePlaceholderProps = {
  title: string
  description: string
}

export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  return (
    <main className="app-shell">
      <section className="placeholder-panel">
        <p className="eyebrow">Mi Boleta</p>
        <h1>{title}</h1>
        <p>{description}</p>

        <nav className="route-links" aria-label="Rutas base">
          <Link to="/login">Login</Link>
          <Link to="/register">Registro</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tickets">Tickets</Link>
          <Link to="/admin/tickets">Admin</Link>
        </nav>
      </section>
    </main>
  )
}
