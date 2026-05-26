import { BarChart2, LayoutDashboard, LogOut, Moon, Plus, ShieldCheck, Sun, Ticket } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export function Navbar() {
  const { logout, user } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-navbar">
      <div className="brand-mark" aria-label="Mi Boleta">
        <span>MB</span>
      </div>

      <nav className="app-nav" aria-label="Navegacion principal">
        <NavLink to="/dashboard">
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/tickets">
          <Ticket size={18} />
          Tickets
        </NavLink>
        <NavLink to="/tickets/new">
          <Plus size={18} />
          Nueva
        </NavLink>
        <NavLink to="/estadisticas">
          <BarChart2 size={18} />
          Estadísticas
        </NavLink>
        {user?.role === 'admin' ? (
          <NavLink to="/admin/tickets">
            <ShieldCheck size={18} />
            Admin
          </NavLink>
        ) : null}
      </nav>

      <div className="navbar-user">
        <div>
          <strong>{user?.name ?? 'Usuario'}</strong>
          <span>{user?.email}</span>
        </div>
        <button
          className="icon-button theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button" type="button" onClick={handleLogout} aria-label="Cerrar sesion">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
