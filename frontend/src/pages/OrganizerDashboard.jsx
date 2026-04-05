import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { eventsAPI, ticketTypesAPI } from "../services/api";
import { 
  FaCheckCircle, FaClock, FaRegFile, FaTimes, FaChartLine, FaPlus, FaSearch, FaCalendarAlt, FaTicketAlt,
  FaCalendarDay, FaHourglassHalf, FaChartBar, FaEdit, FaTrash, FaMapMarkerAlt, FaUsers
} from "react-icons/fa";
import "../styles/dashboard.css";
import CreateEventForm from "./CreateEventForm";

function OrganizerDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const statusIcons = {
    "Publié": { icon: <FaClock color="#3498db" />, label: "Publié" },
    "Brouillon": { icon: <FaRegFile color="#f1c40f" />, label: "Brouillon" },
    "Terminé": { icon: <FaCheckCircle color="#2ecc71" />, label: "Terminé" },
  };

  const normalizeTicketTypes = (ticketTypes = []) => (
    (Array.isArray(ticketTypes) ? ticketTypes : [])
      .map((t) => ({
        id: t?.id,
        name: String(t?.name || "").trim(),
        price: Number(t?.price) || 0,
        quantity: Number(t?.quantity) || 0,
      }))
      .filter((t) => t.name.length > 0)
  );

  const syncEventTicketTypes = async (eventId, submittedTicketTypes, fallbackEventData) => {
    const normalized = normalizeTicketTypes(submittedTicketTypes);
    const targetTicketTypes = normalized.length > 0
      ? normalized
      : [
          {
            name: "Standard",
            price: Number(fallbackEventData?.price) || 0,
            quantity: Number(fallbackEventData?.capacity) || 0,
          },
        ];

    const existingRes = await ticketTypesAPI.listByEvent(eventId);
    const existing = Array.isArray(existingRes.data) ? existingRes.data : [];
    const existingById = new Map(existing.map((t) => [Number(t.id), t]));
    const keptExistingIds = new Set();

    for (const ticketType of targetTicketTypes) {
      const parsedId = Number(ticketType.id);
      const hasExistingId = Number.isInteger(parsedId) && existingById.has(parsedId);

      if (hasExistingId) {
        keptExistingIds.add(parsedId);
        await ticketTypesAPI.update(eventId, parsedId, {
          name: ticketType.name,
          price: ticketType.price,
          quantity: ticketType.quantity,
        });
      } else {
        await ticketTypesAPI.create(eventId, {
          name: ticketType.name,
          price: ticketType.price,
          quantity: ticketType.quantity,
        });
      }
    }

    for (const existingTicketType of existing) {
      const existingId = Number(existingTicketType.id);
      if (!keptExistingIds.has(existingId)) {
        try {
          await ticketTypesAPI.delete(eventId, existingId);
        } catch (err) {
          console.warn("Suppression ticket type ignorée:", err?.response?.data || err.message);
        }
      }
    }
  };

  // ── Auto-update: past events → Terminé ──
  const autoUpdateStatuses = (eventsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventsList.map((event) => {
      if (!event.date) return event;
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      if (event.status === "Publié" && eventDate < today) {
        return { ...event, status: "Terminé" };
      }
      return event;
    });
  };

  // ── Fetch events from API ──
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventsAPI.getMyEvents();
      const updated = autoUpdateStatuses(res.data);
      setEvents(updated);
    } catch (err) {
      console.error("Erreur chargement événements:", err);
      setError("Impossible de charger vos événements.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when user is confirmed as organizer
  useEffect(() => {
    if (!authLoading && user?.role === "organizer") {
      fetchEvents();
    }
  }, [authLoading, user]);

  // ── Guards (AFTER all hooks) ──
  if (authLoading) {
    return (
      <div className="dashboard-container">
        <p style={{ textAlign: "center", padding: "2rem" }}>Chargement...</p>
      </div>
    );
  }

  if (user?.role !== "organizer") {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h2>Accès refusé</h2>
          <p>Vous devez être organisateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // ── Stats (event counts only — no ticket logic yet) ──
  const totalEvents = events.length;
  const publishedCount = events.filter(e => e.status === "Publié").length;
  const draftCount = events.filter(e => e.status === "Brouillon").length;
  const finishedCount = events.filter(e => e.status === "Terminé").length;
  const totalCapacity = events.reduce((acc, e) => acc + (e.capacity || 0), 0);

  // ── Upcoming events (next 3 published) ──
  const upcomingEvents = events
    .filter(e => e.status === "Publié" && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // ── Most popular event (highest capacity) ──
  const topEvent = events.length > 0
    ? events.reduce((prev, cur) => (cur.capacity || 0) > (prev.capacity || 0) ? cur : prev)
    : null;

  // ── Create event handler ──
  const handleAddEvent = async (payload) => {
    try {
      const eventData = payload?.eventData || {};
      const ticketTypes = payload?.ticketTypes || [];

      const createRes = await eventsAPI.create(eventData);
      const eventId = createRes?.data?.id;

      if (!eventId) {
        throw new Error("ID événement manquant après création");
      }

      await syncEventTicketTypes(eventId, ticketTypes, eventData);
      setShowCreate(false);
      fetchEvents(); // Refresh list
    } catch (err) {
      console.error("Erreur création:", err);
      alert("Erreur lors de la création de l'événement: " + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  // ── Edit event handler ──
  const handleUpdateEvent = (event) => {
    setEditingEvent(event);
    setShowCreate(true);
  };

  const handleEditSubmit = async (payload) => {
    try {
      const eventData = payload?.eventData || {};
      const ticketTypes = payload?.ticketTypes || [];

      await eventsAPI.update(editingEvent.id, eventData);
      await syncEventTicketTypes(editingEvent.id, ticketTypes, eventData);
      setEditingEvent(null);
      setShowCreate(false);
      fetchEvents();
    } catch (err) {
      console.error("Erreur modification:", err);
      alert("Erreur lors de la modification: " + (err.response?.data?.detail || err.message));
      throw err;
    }
  };

  // ── Delete event handler ──
  const handleDeleteEvent = async (eventId) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    if (window.confirm(`Voulez-vous vraiment supprimer l'événement "${eventToDelete.title}" ?`)) {
      try {
        await eventsAPI.delete(eventId);
        fetchEvents();
      } catch (err) {
        console.error("Erreur suppression:", err);
        alert("Erreur lors de la suppression: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  // ── Filter + search ──
  const filteredEvents = events.filter((event) => {
    const normalizedStatus = event.status?.trim().toLowerCase();
    const normalizedFilter = statusFilter.trim().toLowerCase();
    const matchStatus = normalizedFilter === "tous" || normalizedStatus === normalizedFilter;
    const matchSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCount = {
    Tous: events.length,
    "Publié": publishedCount,
    "Brouillon": draftCount,
    "Terminé": finishedCount,
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p style={{ textAlign: "center", padding: "2rem" }}>Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="empty-state">
          <h2>Erreur</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
          <p>{totalEvents}</p>
        </div>
        <div className="stat-card">
          <h3>
            <FaCheckCircle /> Publiés
          </h3>
          <p>{publishedCount}</p>
        </div>
        <div className="stat-card">
          <h3>
            <FaRegFile /> Brouillons
          </h3>
          <p>{draftCount}</p>
        </div>
        <div className="stat-card">
          <h3>
            <FaClock /> Terminés
          </h3>
          <p>{finishedCount}</p>
        </div>
      </div>

      {/* ===== TOP EVENT ===== */}
      {topEvent && (
      <div className="dashboard-section">
        <h3>
          <FaChartBar /> Événement avec la plus grande capacité
        </h3>
        <div className="top-event-card">
          <h4>{topEvent.title}</h4>
          <p>
            <FaTicketAlt />{" "}
            {topEvent.capacity} places
          </p>
        </div>
      </div>
      )}

      {/* ===== UPCOMING EVENTS ===== */}
      {upcomingEvents.length > 0 && (
      <div className="dashboard-section">
        <h3>
          <FaClock /> Prochains événements
        </h3>
        {upcomingEvents.map((event) => {
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
      )}

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
            {filteredEvents.map((event) => {
              const tickets = event.tickets || [];
              const prices = tickets.map(t => Number(t.price)).filter(p => !isNaN(p));
              const lowestPrice = prices.length > 0 ? Math.min(...prices) : (event.price || 0);
              const isFree = lowestPrice === 0;
              const statusClass = (event.status || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

              return (
<div key={event.id} className={`event-card-row border-${statusClass}`}>
  <div className="ecr-thumb">
    {event.image ? (
      <img src={event.image} alt={event.title} />
    ) : (
      <div className="ecr-thumb-placeholder"><FaCalendarAlt /></div>
    )}
    <span className={`ecr-badge badge-${statusClass}`}>
      {statusIcons[event.status]?.icon} {event.status}
    </span>
  </div>

  <div className="ecr-body">
    <h4 className="ecr-title">{event.title}</h4>
    <div className="ecr-meta">
      <span><FaCalendarAlt /> {event.date}</span>
      <span><FaClock /> {event.time}</span>
      {event.location && <span><FaMapMarkerAlt /> {event.location}</span>}
    </div>
    <div className="ecr-tags">
      {event.category && <span className="ecr-tag">{event.category}</span>}
      <span className="ecr-tag"><FaUsers /> {event.capacity || 0}</span>
      <span className={`ecr-tag ${isFree ? "ecr-tag-free" : "ecr-tag-price"}`}>
        {isFree ? "Gratuit" : `À partir de ${lowestPrice} TND`}
      </span>
    </div>
  </div>

  <div className="ecr-actions">
    <button className="ecr-btn ecr-btn-edit" title="Modifier" onClick={() => handleUpdateEvent(event)}>
      <FaEdit />
    </button>
    <button className="ecr-btn ecr-btn-delete" title="Supprimer" onClick={() => handleDeleteEvent(event.id)}>
      <FaTrash />
    </button>
  </div>
</div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucun événement trouvé</p>
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
        initialData={editingEvent}
      />
    </div>
  </div>
)}
    </div>
  );
}

export default OrganizerDashboard;