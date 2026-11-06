
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/layout/ProtectedRoute'
import ConfigureDebate from './pages/ConfigureDebate'
import SelectCouncil from './pages/SelectCouncil'
import DebateSetup from './pages/DebateSetup'
import DebateWorkspace from './pages/DebateWorkspace'
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/configure" element={<ConfigureDebate />} />
        <Route path="/select-council" element={<SelectCouncil />} />
        <Route path="/debate/new" element={<DebateSetup />} />
        <Route path="/debate/:sessionId" element={<DebateWorkspace />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
