import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '../components/ProtectedRoute'
import { AuthProvider } from '../context/AuthContext'
import { AdminTickets } from '../pages/AdminTickets'
import { Dashboard } from '../pages/Dashboard'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { TicketCreate } from '../pages/TicketCreate'
import { TicketEdit } from '../pages/TicketEdit'
import { Tickets } from '../pages/Tickets'
import { Unauthorized } from '../pages/Unauthorized'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<TicketCreate />} />
            <Route path="/tickets/:id/edit" element={<TicketEdit />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
