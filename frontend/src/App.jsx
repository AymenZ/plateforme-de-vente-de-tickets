import { useState } from 'react'
import Navigation from './components/Navigation'
import CatalogPage from './pages/CatalogPage'
import EventDetailPage from './pages/EventDetailPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('catalog')
  const [selectedEventId, setSelectedEventId] = useState(null)
  // État utilisateur: null (déconnecté), 'client', 'organizer', 'admin'
  const [userType, setUserType] = useState(null)

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId)
    setCurrentPage('detail')
  }

  const handleBack = () => {
    setCurrentPage('catalog')
    setSelectedEventId(null)
  }



  return (
    <div className="app">
      <Navigation
        userType={
          currentPage === "catalog" || currentPage === "detail"
          ? "client"
          : userType
          }
        onLogoClick={() => setCurrentPage("catalog")}
        onLoginClick={() => setUserType("client")}
        onSignupClick={() => setUserType("organizer")}
        onLogoutClick={() => setUserType(null)}
      />

      
      {currentPage === 'catalog' ? (
        <CatalogPage onEventSelect={handleEventSelect} />
      ) : (
        <EventDetailPage eventId={selectedEventId} onBack={handleBack} />
      )}
    </div>
  )
}

export default App

