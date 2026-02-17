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


/*
import React, { useState } from "react";
import Navigation from "./components/Navigation";

function App() {
  const [userType, setUserType] = useState(null);

  return (
    <>
      <Navigation
        userType={userType}
        onLogoClick={() => setUserType(null)}
        onLoginClick={() => setUserType("client")}
        onSignupClick={() => setUserType("organizer")}
        onLogoutClick={() => setUserType(null)}
      />

      <div style={{ padding: "20px" }}>
        <h2>Simulation Auth (Sprint 2)</h2>
        <p>Changer de rôle pour tester l’interface :</p>

        <button onClick={() => setUserType("client")}>Client</button>
        <button onClick={() => setUserType("organizer")}>Organisateur</button>
        <button onClick={() => setUserType("admin")}>Admin</button>
        <button onClick={() => setUserType(null)}>Déconnecté</button>
      </div>
    </>
  );
}

export default App;
*/