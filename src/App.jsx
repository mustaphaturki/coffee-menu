import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Menu from './menu/pages/Menu'
import AdminDashboard from './admin/pages/AdminDashboard'
import Login from './admin/pages/Login'
import ProtectedRoute from './shared/components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App