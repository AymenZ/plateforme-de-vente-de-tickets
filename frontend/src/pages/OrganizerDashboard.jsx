//i don't know why when i click in terminé or brouillon or terminé, he doesn't filter it , he still affiched all the events, and in terminé ther are some events that have a date > of the date of today and affiched in terminé, whish is not logic:
import React, { useState, useEffect } from "react";
import { organizerEvents, organizerStats } from "../data/mockData";
import { 
  FaCheckCircle, FaClock, FaRegFile, FaTimes, FaChartLine, FaPlus, FaSearch, FaCalendarAlt, FaTicketAlt, FaMoneyBillWave, FaUsers, 
  FaCalendarDay, FaHourglassHalf, FaMusic, FaInfoCircle, FaChartBar, FaEdit, FaTrash 
} from "react-icons/fa";
import "../styles/dashboard.css";
import CreateEventForm from "./CreateEventForm";

function OrganizerDashboard() {
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const statusIcons = {
  Publié: { icon: <FaClock color="#3498db" />, label: "Publié" },
  Brouillon: { icon: <FaRegFile color="#f1c40f" />, label: "Brouillon" },
  Terminé: { icon: <FaCheckCircle color="#2ecc71" />, label: "Terminé" },
};

const handleUpdateEvent = (event) => {
  setEditingEvent(event);
  setShowCreate(true); // open modal
};

const handleEditSubmit = (updatedEvent) => {
  const updatedEvents = events.map((e) =>
    e.id === updatedEvent.id ? updatedEvent : e
  );
  setEvents(updatedEvents);
  localStorage.setItem("organizerEvents", JSON.stringify(updatedEvents));
  setEditingEvent(null);
};
  /*
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem("organizerEvents");
    return savedEvents ? JSON.parse(savedEvents) : organizerEvents;
  });
  */
 //Auto-update event status
  const updateEventStatuses = (eventsList) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // remove time

  return eventsList.map((event) => {
    if (!event.date) return event;

    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0); // remove time

    if (event.status === "Publié" && eventDate < today) {
      return { ...event, status: "Terminé" };
  }

    return event;
  });
  };

  //Load events (merge mockData + localStorage)
  const [events, setEvents] = useState(() => {
  const saved = localStorage.getItem("organizerEvents");

  if (saved) {
    return updateEventStatuses(JSON.parse(saved));
  }

  return updateEventStatuses(organizerEvents);
  });

  //const [activeFilter, setActiveFilter] = useState("Tous");

  //save to localStorage when events change
   useEffect(() => {
    localStorage.setItem("organizerEvents", JSON.stringify(events));
  }, [events]);

  /*useEffect(() => {
  const updated = updateEventStatuses(events);
  setEvents(updated);
}, []);*/
  //calculate stats
  const totalTicketsSold = events.reduce((acc, e) => acc + e.ticketsSold, 0);
  const totalRevenue = events.reduce((acc, e) => acc + e.revenue, 0);
  const totalCapacity = events.reduce((acc, e) => acc + e.capacity, 0);

  const occupancy =
    totalCapacity > 0
      ? ((totalTicketsSold / totalCapacity) * 100).toFixed(1)
      : 0;
  const handleAddEvent = (newEvent) => {
  const today = new Date();
  const eventDate = new Date(newEvent.date);

  const updatedEvent =
    eventDate < today
      ? { ...newEvent, status: "Terminé" }
      : newEvent;

  setEvents((prev) => [...prev, updatedEvent]);
  setShowCreate(false);
};

  // Filtrer et chercher les événements
  const filteredEvents = events.filter((event) => {
  const normalizedStatus = event.status?.trim().toLowerCase();
  const normalizedFilter = statusFilter.trim().toLowerCase();

  const matchStatus =
    normalizedFilter === "tous" || normalizedStatus === normalizedFilter;

  const matchSearch =
    event.title.toLowerCase().includes(searchTerm.toLowerCase());

  return matchStatus && matchSearch;
  });

  // Compter par statut
  const statusCount = {
  Tous: events.length,
  Publié: events.filter((e) => e.status === "Publié").length,
  Brouillon: events.filter((e) => e.status === "Brouillon").length,
  Terminé: events.filter((e) => e.status === "Terminé").length,
};

  //delete event 
  const handleDeleteEvent = (eventId) => {
  const eventToDelete = events.find(e => e.id === eventId);
  if (!eventToDelete) return;

  if (window.confirm(`Voulez-vous vraiment supprimer l'événement "${eventToDelete.title}" ?`)) {
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem("organizerEvents", JSON.stringify(updatedEvents));
    alert("Événement supprimé avec succès !");
  }
};

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>
          <FaChartLine /> Tableau de Bord Organisateur
        </h2>
        <button className="btn-create-event" onClick={() => setShowCreate(true)}>
          <FaPlus /> Créer un événement
        </button>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>
            <FaCalendarAlt /> Total Événements
          </h3>
          <p>{events.length}</p>
        </div>
        <div className="stat-card">
          <h3>
            <FaTicketAlt /> Tickets Vendus
          </h3>
          <p>{totalTicketsSold}</p>
        </div>
        <div className="stat-card">
          <h3>
            <FaMoneyBillWave /> Revenu Total
          </h3>
          <p>{totalRevenue} TND</p>
        </div>
        <div className="stat-card">
          <h3>
            <FaUsers /> Taux de Remplissage
          </h3>
          <p>{occupancy}%</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${occupancy}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ===== TOP EVENT ===== */}
      <div className="dashboard-section">
        <h3>
          <FaChartBar /> Événement le plus populaire
        </h3>
        <div className="top-event-card">
          <h4>{organizerStats.topEvent.title}</h4>
          <p>
            <FaTicketAlt />{" "}
            {organizerStats.topEvent.ticketsSold} tickets vendus
          </p>
        </div>
      </div>

      {/* ===== UPCOMING EVENTS ===== */}
      <div className="dashboard-section">
        <h3>
          <FaClock /> Prochains événements
        </h3>
        {organizerStats.upcomingEvents.map((event) => {
          const daysLeft = Math.ceil(
            (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div key={event.id} className="upcoming-card">
              <h4>
                <FaCalendarAlt /> {event.title}
              </h4>
              <p>
                <FaCalendarDay /> {event.date}
              </p>
              <p>
                <FaHourglassHalf /> {daysLeft} jours restants
              </p>
            </div>
          );
        })}
      </div>

      {/* ===== EVENTS LIST ===== */}
      <div className="dashboard-section">
        <div className="events-header">
          <h3>
            <FaChartBar /> Mes Événements
          </h3>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {Object.entries(statusCount).map(([status, count]) => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? "active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status} <span className="count-badge">{count}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <FaSearch />
          <input
            type="text"
            placeholder="Chercher un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Events Table */}
        {filteredEvents.length > 0 ? (
          <div className="events-table">
            {filteredEvents.map((event) => (
<div key={event.id} className="event-row">
  <div className="event-image">
    <img src={event.image} alt={event.title} />
  </div>

  <div className="event-info">
    <h4>{event.title}</h4>
    <p>{event.category} • {event.date} • {event.time}</p>
    <div className="event-status">
      {statusIcons[event.status]?.icon} <span>{statusIcons[event.status]?.label}</span>
    </div>
  </div>

  <div className="event-stats">
    <div>Tickets: {event.ticketsSold} / {event.capacity}</div>
    <div>Revenu: {event.revenue === 0 ? "Gratuit" : `${event.revenue} TND`}</div>
  </div>

  <div className="event-actions">
    <button className="btn-icon btn-edit" title="Modifier" onClick={() => handleUpdateEvent(event)}>
      <FaEdit />
    </button>
    <button className="btn-icon btn-delete" title="Supprimer" onClick={() => handleDeleteEvent(event.id)}>
      <FaTrash />
    </button>
  </div>
</div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucun événement trouvé</p>
            {/*<button className="btn-create-event-small">
              <FaPlus /> Créer votre premier événement
            </button>*/}
          </div>
        )}
      </div>

      {/* ===== CREATE EVENT MODAL ===== */}
      {showCreate && (
  <div className="modal-overlay">
    <div className="modal-content">
      <button className="modal-close" onClick={() => { setShowCreate(false); setEditingEvent(null); }}>
        <FaTimes className="close-icon" />
      </button>
      <CreateEventForm
        onCancel={() => { setShowCreate(false); setEditingEvent(null); }}
        onAddEvent={editingEvent ? handleEditSubmit : handleAddEvent}
        initialData={editingEvent} // <-- pass event to edit
      />
    </div>
  </div>
)}
    </div>
  );
}

export default OrganizerDashboard;