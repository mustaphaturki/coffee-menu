import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './pages/Menu';
import Admin from './pages/AdminDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer menu */}
        <Route path="/" element={<Menu />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected admin */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
