# 🎟️ Mi Boleta

Aplicación web para **registrar y hacer seguimiento a boletas de lotería, rifas y sorteos**: cuánto se apostó, dónde, para qué fecha y si se ganó o se perdió. Incluye panel de estadísticas y un módulo de administración.

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white)

## ✨ Funcionalidades

- 🔐 **Registro e inicio de sesión con JWT**, sesión persistida y cliente HTTP (Axios) que adjunta el token automáticamente.
- 🛡️ **Rutas protegidas** para usuarios autenticados y **rutas solo para administradores** (`/admin/tickets`).
- 🎫 **CRUD de boletas**: tipo de juego (lotería, rifa, sorteo, boleta, juego ocasional), número, fecha, monto, lugar, estado (pendiente / ganado / perdido) y notas.
- ✅ **Formularios validados** con React Hook Form + Zod, con mensajes de error claros.
- 📊 **Estadísticas** con gráficos: boletas por estado, por tipo de juego y por mes, total apostado y total ganado.
- 📄 **Paginación** del lado del servidor y estados de carga y error.
- 🌗 **Tema claro / oscuro** que respeta la preferencia del sistema y se recuerda.
- 🎉 Notificaciones (toasts) y confeti al marcar una boleta como ganada.
- 🌱 **Script de seed** que crea más de 1.000 boletas de prueba contra la API.

## 🧱 Estructura

```
src/
  api/         → Cliente Axios, llamadas de auth, boletas y admin
  context/     → AuthContext, ThemeContext, ToastContext
  routes/      → AppRouter con rutas protegidas y de administrador
  pages/       → Login, Register, Dashboard, Tickets, TicketCreate/Edit, Stats, AdminTickets
  components/  → Navbar, TicketCard, TicketForm, Pagination, ProtectedRoute, AdminRoute…
  hooks/       → useConfetti
  types/       → Tipos de la API, boletas y autenticación
  utils/       → Formato de moneda y utilidades de boletas
scripts/
  seedTickets.js → Carga masiva de datos de prueba
```

## ▶️ Cómo ejecutarlo

```bash
npm install
cp .env.example .env      # VITE_API_URL=<url de la API>/api/v1
npm run dev
```

Otros scripts:

```bash
npm run build             # typecheck + build de producción
npm run seed:tickets      # crea boletas de prueba (requiere un usuario administrador en la API)
```
