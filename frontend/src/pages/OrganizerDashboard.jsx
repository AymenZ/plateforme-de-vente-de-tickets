import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { eventsAPI, ticketTypesAPI } from "../services/api";
import { 
  FaCheckCircle, FaClock, FaRegFile, FaTimes, FaChartLine, FaPlus, FaSearch, FaCalendarAlt, FaTicketAlt,
  FaCalendarDay, FaHourglassHalf, FaChartBar, FaEdit, FaTrash, FaMapMarkerAlt,
  FaMoneyBillWave, FaCommentDots, FaStar
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
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const eventStatsById = useMemo(() => {
    const map = new Map();
    (Array.isArray(dashboardStats?.by_event) ? dashboardStats.by_event : []).forEach((eventStats) => {
      map.set(Number(eventStats.event_id), eventStats);
    });
    return map;
  }, [dashboardStats]);

  const statusIcons = {
    "Publié": { icon: <FaClock color="#3498db" />, label: "Publié" },
    "Brouillon": { icon: <FaRegFile color="#f1c40f" />, label: "Brouillon" },
    "Terminé": { icon: <FaCheckCircle color="#2ecc71" />, label: "Terminé" },
  };

  const getDisplayStatusLabel = (rawStatus = "", eventDate = "") => {
    const normalized = normalizeStatus(rawStatus);

    if (normalized === "published" || normalized === "publie") {
      if (eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const parsedDate = new Date(eventDate);
        parsedDate.setHours(0, 0, 0, 0);

        if (!Number.isNaN(parsedDate.getTime()) && parsedDate < today) {
          return "Terminé";
        }
      }
      return "Publié";
    }

    if (normalized === "draft" || normalized === "brouillon") return "Brouillon";
    if (normalized === "finished" || normalized === "termine") return "Terminé";

    return String(rawStatus || "Brouillon");
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

  const normalizeStatus = (status = "") => (
    String(status)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  );

  const formatCurrency = (amount, currency = "USD") => {
    const value = Number(amount || 0);
    const code = String(currency || "USD").toUpperCase();
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: code,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${code}`;
    }
  };

  const formatRating = (rating) => {
    if (rating === null || rating === undefined) {
      return "N/A";
    }
    return `${Number(rating).toFixed(1)}/5`;
  };

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
    const safeEvents = Array.isArray(eventsList) ? eventsList : [];
    return safeEvents
      .filter((event) => event && typeof event === "object")
      .map((event) => ({
        ...event,
        status: getDisplayStatusLabel(event.status, event.date),
      }));
  };

  // ── Fetch events from API ──
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        eventsAPI.getMyEvents(),
        eventsAPI.getOrganizerStats(),
      ]);

      const updated = autoUpdateStatuses(eventsRes?.data);
      setEvents(updated);
      setDashboardStats(statsRes?.data || null);
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

  // ── Stats summary ──
  const summary = dashboardStats?.summary || {};
  const totalEvents = events.length;

  const localStatusCounts = events.reduce(
    (acc, event) => {
      const displayStatus = getDisplayStatusLabel(event.status, event.date);
      if (displayStatus === "Publié") acc.published += 1;
      else if (displayStatus === "Brouillon") acc.draft += 1;
      else if (displayStatus === "Terminé") acc.finished += 1;
      return acc;
    },
    { published: 0, draft: 0, finished: 0 }
  );

  const publishedCount = localStatusCounts.published;
  const draftCount = localStatusCounts.draft;
  const finishedCount = localStatusCounts.finished;
  const totalRevenue = Number(summary.total_revenue || 0);
  const totalTicketsSold = Number(summary.total_tickets_sold || 0);
  const totalComments = Number(summary.total_comments || 0);
  const averageRating = summary.average_rating;
  const summaryCurrency = String(summary.currency || "USD").toUpperCase();

  // ── Upcoming events (next 3 published) ──
  const upcomingEvents = events
    .filter((e) => {
      const isPublished = getDisplayStatusLabel(e.status, e.date) === "Publié";
      const timestamp = new Date(e.date).getTime();
      return isPublished && !Number.isNaN(timestamp) && timestamp >= Date.now();
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  // ── Top event (most sold tickets) ──
  const topEvent = events.length > 0
    ? events.reduce((prev, cur) => {
        const prevSold = Number(eventStatsById.get(prev.id)?.tickets_sold || 0);
        const curSold = Number(eventStatsById.get(cur.id)?.tickets_sold || 0);
        return curSold > prevSold ? cur : prev;
      })
    : null;
  const topEventStats = topEvent ? eventStatsById.get(topEvent.id) : null;

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
  const filteredEvents = useMemo(() => {
    const normalizedFilter = normalizeStatus(statusFilter);
    const normalizedSearch = String(searchTerm || "").toLowerCase().trim();

    const candidates = events.filter((event) => {
      const eventStatus = normalizeStatus(getDisplayStatusLabel(event.status, event.date));
      const matchStatus = normalizedFilter === "tous" || eventStatus === normalizedFilter;

      const haystack = [
        String(event.title || ""),
        String(event.category || ""),
        String(event.location || ""),
      ].join(" ").toLowerCase();
      const matchSearch = normalizedSearch.length === 0 || haystack.includes(normalizedSearch);

      return matchStatus && matchSearch;
    });

    const sorted = [...candidates].sort((a, b) => {
      const statsA = eventStatsById.get(Number(a.id)) || {};
      const statsB = eventStatsById.get(Number(b.id)) || {};
      const direction = sortDirection === "asc" ? 1 : -1;

      const dateA = new Date(a.date || 0).getTime() || 0;
      const dateB = new Date(b.date || 0).getTime() || 0;

      const revenueA = Number(statsA.revenue || 0);
      const revenueB = Number(statsB.revenue || 0);

      const ticketsA = Number(statsA.tickets_sold || 0);
      const ticketsB = Number(statsB.tickets_sold || 0);

      const commentsA = Number(statsA.comments_count || 0);
      const commentsB = Number(statsB.comments_count || 0);

      const ratingA = statsA.average_rating === null || statsA.average_rating === undefined
        ? -1
        : Number(statsA.average_rating);
      const ratingB = statsB.average_rating === null || statsB.average_rating === undefined
        ? -1
        : Number(statsB.average_rating);

      if (sortBy === "revenue") return (revenueA - revenueB) * direction;
      if (sortBy === "tickets") return (ticketsA - ticketsB) * direction;
      if (sortBy === "comments") return (commentsA - commentsB) * direction;
      if (sortBy === "rating") return (ratingA - ratingB) * direction;
      if (sortBy === "title") {
        const titleA = String(a?.title || "");
        const titleB = String(b?.title || "");
        return titleA.localeCompare(titleB) * direction;
      }
      return (dateA - dateB) * direction;
    });

    return sorted;
  }, [events, eventStatsById, searchTerm, sortBy, sortDirection, statusFilter]);

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
    <div className="dashboard-container orgd-container">
      <div className="dashboard-header orgd-header">
        <h2 className="orgd-title">
          <FaChartLine /> Tableau de Bord Organisateur
        </h2>
        <button className="btn-create-event orgd-create-btn" onClick={() => setShowCreate(true)}>
          <FaPlus /> Créer un événement
        </button>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="dashboard-stats orgd-kpi-grid">
        <div className="stat-card orgd-kpi-card">
          <h3>
            <FaCalendarAlt /> Total Événements
          </h3>
          <p>{totalEvents}</p>
        </div>
        <div className="stat-card orgd-kpi-card">
          <h3>
            <FaCheckCircle /> Publiés
          </h3>
          <p>{publishedCount}</p>
        </div>
        <div className="stat-card orgd-kpi-card">
          <h3>
            <FaRegFile /> Brouillons
          </h3>
          <p>{draftCount}</p>
        </div>
        <div className="stat-card orgd-kpi-card">
          <h3>
            <FaClock /> Terminés
          </h3>
          <p>{finishedCount}</p>
        </div>
        <div className="stat-card orgd-kpi-card accent-money">
          <h3>
            <FaMoneyBillWave /> Revenus
          </h3>
          <p>{formatCurrency(totalRevenue, summaryCurrency)}</p>
        </div>
        <div className="stat-card orgd-kpi-card">
          <h3>
            <FaTicketAlt /> Tickets Vendus
          </h3>
          <p>{totalTicketsSold}</p>
        </div>
        <div className="stat-card orgd-kpi-card">
          <h3>
            <FaCommentDots /> Commentaires
          </h3>
          <p>{totalComments}</p>
        </div>
        <div className="stat-card orgd-kpi-card accent-rating">
          <h3>
            <FaStar /> Note Moyenne
          </h3>
          <p>{formatRating(averageRating)}</p>
        </div>
      </div>

      {/* ===== TOP EVENT ===== */}
      {topEvent && (
      <div className="dashboard-section orgd-hero-section">
        <h3>
          <FaChartBar /> Événement le plus performant
        </h3>
        <div className="top-event-card orgd-top-card">
          <h4>{topEvent.title}</h4>
          <p>
            <FaTicketAlt /> {Number(topEventStats?.tickets_sold || 0)} tickets vendus
          </p>
          <p>
            <FaMoneyBillWave /> {formatCurrency(Number(topEventStats?.revenue || 0), summaryCurrency)}
          </p>
        </div>
      </div>
      )}

      {/* ===== UPCOMING EVENTS ===== */}
      {upcomingEvents.length > 0 && (
      <div className="dashboard-section orgd-hero-section">
        <h3>
          <FaClock /> Prochains événements
        </h3>
        {upcomingEvents.map((event) => {
          const daysLeft = Math.ceil(
            (new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div key={event.id} className="upcoming-card orgd-upcoming-card">
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
      <div className="dashboard-section orgd-list-section">
        <div className="events-header orgd-events-header">
          <h3>
            <FaChartBar /> Mes Événements
          </h3>
        </div>

        <div className="orgd-controls-grid">
          <div className="filter-tabs orgd-filter-tabs">
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

          <div className="orgd-search-sort-row">
            <div className="search-bar orgd-search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Chercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="orgd-sort-box">
              <label htmlFor="sort-by">Trier par</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Date</option>
                <option value="title">Titre</option>
                <option value="revenue">Revenus</option>
                <option value="tickets">Tickets vendus</option>
                <option value="rating">Note moyenne</option>
                <option value="comments">Commentaires</option>
              </select>
            </div>

            <div className="orgd-sort-box">
              <label htmlFor="sort-direction">Ordre</label>
              <select
                id="sort-direction"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
              >
                <option value="desc">Descendant</option>
                <option value="asc">Ascendant</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Table */}
        {filteredEvents.length > 0 ? (
          <div className="events-table orgd-events-table">
            {filteredEvents.map((event) => {
              const tickets = event.tickets || [];
              const prices = tickets.map(t => Number(t.price)).filter(p => !isNaN(p));
              const lowestPrice = prices.length > 0 ? Math.min(...prices) : (event.price || 0);
              const isFree = lowestPrice === 0;
              const displayStatus = getDisplayStatusLabel(event.status, event.date);
              const statusClass = normalizeStatus(displayStatus);
              const eventStats = eventStatsById.get(Number(event.id));
              const soldTickets = Number(eventStats?.tickets_sold || 0);
              const eventComments = Number(eventStats?.comments_count || 0);
              const eventRevenue = Number(eventStats?.revenue || 0);
              const eventRating = eventStats?.average_rating;

              return (
<div key={event.id} className={`event-card-row orgd-event-row border-${statusClass}`}>
  <div className="ecr-thumb">
    {event.image ? (
      <img src={event.image} alt={event.title} />
    ) : (
      <div className="ecr-thumb-placeholder"><FaCalendarAlt /></div>
    )}
    <span className={`ecr-badge badge-${statusClass}`}>
      {statusIcons[displayStatus]?.icon} {displayStatus}
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
      <span className="ecr-tag"><FaTicketAlt /> Capacité {event.capacity || 0}</span>
      <span className={`ecr-tag ${isFree ? "ecr-tag-free" : "ecr-tag-price"}`}>
        {isFree ? "Gratuit" : `À partir de ${lowestPrice} TND`}
      </span>
      <span className="ecr-tag ecr-tag-revenue"><FaMoneyBillWave /> {formatCurrency(eventRevenue, summaryCurrency)}</span>
      <span className="ecr-tag"><FaTicketAlt /> {soldTickets} vendus</span>
      <span className="ecr-tag"><FaCommentDots /> {eventComments} avis</span>
      <span className="ecr-tag"><FaStar /> {formatRating(eventRating)}</span>
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