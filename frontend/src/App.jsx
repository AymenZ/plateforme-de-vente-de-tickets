import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import Navigation from './components/Navigation'
import CatalogPage from './pages/CatalogPage'
import EventDetailPage from './pages/EventDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import OrganizerDashboard from './pages/OrganizerDashboard'
import './App.css'

function App() {
  const navigate = useNavigate()

  const handleEventSelect = (eventId) => {
    navigate(`/event/${eventId}`)
  }

  return (
    <div className="app">
      <Navigation />

      <Routes>
        <Route path="/" element={<CatalogPage onEventSelect={handleEventSelect} />} />
        <Route path="/event/:id" element={<EventDetailPageWrapper />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dashboard" element={<OrganizerDashboard />} />
      </Routes>
    </div>
  )
}

// Wrapper to pass URL params to EventDetailPage
function EventDetailPageWrapper() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <EventDetailPage
      eventId={id}
      onBack={() => navigate('/')}
    />
  )
}

export default App

