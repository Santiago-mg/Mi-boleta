import { ThemeProvider } from './context/ThemeContext'
import { AppRouter } from './routes/AppRouter'

export default function App() {
  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}
