import { Outlet } from 'react-router-dom'

import { ToastProvider } from '../context/ToastContext'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <ToastProvider>
      <div className="app-frame">
        <Navbar />
        <Outlet />
      </div>
    </ToastProvider>
  )
}
