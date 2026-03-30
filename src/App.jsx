import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import Login from './components/Login'
import AppLayout from './components/AppLayout'
import PublicRack from './pages/PublicRack'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const user = useAuth()
  if (user === undefined) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function LoginRoute() {
  const user = useAuth()
  if (user === undefined) return <Spinner />
  if (user) return <Navigate to="/" replace />
  return <Login />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/rack/:rackId" element={<PublicRack />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}
