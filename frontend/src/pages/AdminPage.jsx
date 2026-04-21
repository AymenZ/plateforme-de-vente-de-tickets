import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { commentsAPI, eventsAPI, usersAPI } from '../services/api';
import {
  FaCalendarAlt,
  FaChartLine,
  FaCommentDots,
  FaExchangeAlt,
  FaSave,
  FaSearch,
  FaTicketAlt,
  FaTrash,
  FaUserShield,
  FaUsers,
} from 'react-icons/fa';
import '../styles/AdminPage.css';

function AdminPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [comments, setComments] = useState([]);

  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [commentSearchTerm, setCommentSearchTerm] = useState('');

  const [editingRoles, setEditingRoles] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [ticketsSoldTotal, setTicketsSoldTotal] = useState(0);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [revenueCurrency, setRevenueCurrency] = useState('USD');

  const clearMessagesLater = () => {
    setTimeout(() => setSuccessMsg(''), 3000);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const normalizeRole = (roleName) => {
    if (!roleName) return 'client';
    const lower = roleName.toLowerCase();
    if (lower === 'organizer') return 'organizer';
    if (lower === 'admin') return 'admin';
    return 'client';
  };

  const toBackendRole = (role) => {
    const map = { client: 'CLIENT', organizer: 'ORGANIZER', admin: 'ADMIN' };
    return map[role] || 'CLIENT';
  };

  const normalizeStatus = (status = '') => (
    String(status)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
  );

  const eventStatusLabel = (status = '') => {
    const normalized = normalizeStatus(status);
    if (normalized === 'published' || normalized === 'publie') return 'Publié';
    if (normalized === 'depublished' || normalized === 'depublie' || normalized === 'unpublished') return 'Dépublié';
    if (normalized === 'draft' || normalized === 'brouillon') return 'Brouillon';
    if (normalized === 'finished' || normalized === 'termine') return 'Terminé';
    return status || 'Inconnu';
  };

  const eventStatusClass = (status = '') => {
    const normalized = normalizeStatus(status);
    if (normalized === 'published' || normalized === 'publie') return 'published';
    if (normalized === 'depublished' || normalized === 'depublie' || normalized === 'unpublished') return 'depublished';
    if (normalized === 'draft' || normalized === 'brouillon') return 'draft';
    if (normalized === 'finished' || normalized === 'termine') return 'finished';
    return 'neutral';
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const numericAmount = Number(amount || 0);
    const code = String(currency || 'USD').toUpperCase();

    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: code,
      }).format(numericAmount);
    } catch {
      return `${numericAmount.toFixed(2)} ${code}`;
    }
  };

  const renderStars = (rating) => {
    const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
    return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
  };

  const excerpt = (value = '', maxLen = 90) => {
    const text = String(value || '').trim();
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}...`;
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const [usersRes, eventsRes, commentsRes, statsRes] = await Promise.all([
        usersAPI.listAll(),
        eventsAPI.getAdminAll(),
        commentsAPI.listAllForAdmin({ limit: 500 }),
        eventsAPI.getOrganizerStats(),
      ]);

      const mappedUsers = (usersRes.data || []).map((u) => ({
        id: u.id,
        email: u.email,
        role: normalizeRole(u.role_name),
      }));

      setUsers(mappedUsers);
      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);

      const summary = statsRes?.data?.summary || {};
      setTicketsSoldTotal(Number(summary.total_tickets_sold || 0));
      setRevenueTotal(Number(summary.total_revenue || 0));
      setRevenueCurrency(String(summary.currency || 'USD').toUpperCase());
    } catch (err) {
      setErrorMsg('Erreur lors du chargement des données admin.');
      console.error(err);
      clearMessagesLater();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const filteredUsers = useMemo(() => {
    const query = userSearchTerm.toLowerCase().trim();
    return users.filter((u) => u.email.toLowerCase().includes(query));
  }, [users, userSearchTerm]);

  const filteredEvents = useMemo(() => {
    const query = eventSearchTerm.toLowerCase().trim();
    return events.filter((event) =>
      String(event?.title || '').toLowerCase().includes(query)
    );
  }, [events, eventSearchTerm]);

  const filteredComments = useMemo(() => {
    const query = commentSearchTerm.toLowerCase().trim();
    return comments.filter((comment) => {
      const byAuthor = String(comment?.author_email || '').toLowerCase().includes(query);
      const byEvent = String(comment?.event_title || '').toLowerCase().includes(query);
      return byAuthor || byEvent;
    });
  }, [comments, commentSearchTerm]);

  const stats = {
    totalUsers: users.length,
    organizers: users.filter((u) => u.role === 'organizer').length,
    totalEvents: events.length,
    totalComments: comments.length,
    totalTicketsSold: ticketsSoldTotal,
    revenue: formatCurrency(revenueTotal, revenueCurrency),
  };

  const handleRoleChange = (userId, newRole) => {
    setEditingRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const saveRole = async (userId) => {
    const newRole = editingRoles[userId];
    if (!newRole) return;

    try {
      await usersAPI.updateRole(userId, toBackendRole(newRole));

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setEditingRoles((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setSuccessMsg('Rôle mis à jour avec succès.');
      setErrorMsg('');
      clearMessagesLater();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors de la mise à jour du rôle.';
      setErrorMsg(detail);
      clearMessagesLater();
    }
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Supprimer l'utilisateur ${email} ?`)) return;

    try {
      await usersAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMsg('Utilisateur supprimé avec succès.');
      setErrorMsg('');
      clearMessagesLater();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors de la suppression.';
      setErrorMsg(detail);
      clearMessagesLater();
    }
  };

  const toggleEventStatus = async (event) => {
    if (!window.confirm(`Basculer le statut de "${event.title}" ?`)) return;

    try {
      const res = await eventsAPI.toggleAdminStatus(event.id);
      const updated = res?.data;
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, ...updated } : e))
      );
      setSuccessMsg('Statut de l\'événement mis à jour.');
      setErrorMsg('');
      clearMessagesLater();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors du changement de statut.';
      setErrorMsg(detail);
      clearMessagesLater();
    }
  };

  const deleteEvent = async (event) => {
    if (!window.confirm(`Supprimer l'événement "${event.title}" ?`)) return;

    try {
      await eventsAPI.delete(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      setComments((prev) => prev.filter((c) => Number(c.event_id) !== Number(event.id)));
      setSuccessMsg('Événement supprimé avec succès.');
      setErrorMsg('');
      clearMessagesLater();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors de la suppression de l\'événement.';
      setErrorMsg(detail);
      clearMessagesLater();
    }
  };

  const deleteComment = async (comment) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;

    try {
      await commentsAPI.delete(comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      setSuccessMsg('Commentaire supprimé avec succès.');
      setErrorMsg('');
      clearMessagesLater();
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors de la suppression du commentaire.';
      setErrorMsg(detail);
      clearMessagesLater();
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="empty-state">
          <h2>Accès refusé</h2>
          <p>Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Administration</h1>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-icon users"><FaUsers /></div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Utilisateurs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon organizers"><FaUserShield /></div>
          <div className="stat-info">
            <h3>{stats.organizers}</h3>
            <p>Organisateurs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon events"><FaCalendarAlt /></div>
          <div className="stat-info">
            <h3>{stats.totalEvents}</h3>
            <p>Événements</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon comments"><FaCommentDots /></div>
          <div className="stat-info">
            <h3>{stats.totalComments}</h3>
            <p>Commentaires</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tickets"><FaTicketAlt /></div>
          <div className="stat-info">
            <h3>{stats.totalTicketsSold}</h3>
            <p>Tickets vendus</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue"><FaChartLine /></div>
          <div className="stat-info">
            <h3>{stats.revenue}</h3>
            <p>Revenus</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="auth-success" style={{ maxWidth: '560px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="auth-error" style={{ maxWidth: '560px' }}>
          {errorMsg}
        </div>
      )}

      <div className="admin-section">
        <div className="section-header">
          <h2><FaUsers /> Gestion des Utilisateurs</h2>
          <input
            type="text"
            className="section-search"
            placeholder="Rechercher par email..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">Chargement des utilisateurs...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.email}</td>
                      <td>
                        {editingRoles[u.id] !== undefined ? (
                          <select
                            className="role-select"
                            value={editingRoles[u.id]}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="client">Client</option>
                            <option value="organizer">Organisateur</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`role-badge ${u.role}`}>
                            {u.role === 'organizer' ? 'Organisateur' : u.role === 'admin' ? 'Admin' : 'Client'}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {editingRoles[u.id] !== undefined ? (
                            <button
                              className="btn-action btn-save"
                              onClick={() => saveRole(u.id)}
                            >
                              <FaSave /> Sauver
                            </button>
                          ) : (
                            <button
                              className="btn-action btn-save"
                              onClick={() => handleRoleChange(u.id, u.role)}
                            >
                              Modifier
                            </button>
                          )}
                          {u.role !== 'admin' && (
                            <button
                              className="btn-action btn-delete"
                              onClick={() => deleteUser(u.id, u.email)}
                            >
                              <FaTrash /> Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2><FaCalendarAlt /> Gestion des Événements</h2>
          <input
            type="text"
            className="section-search"
            placeholder="Rechercher par titre d'événement..."
            value={eventSearchTerm}
            onChange={(e) => setEventSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">Chargement des événements...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Titre</th>
                  <th>Organisateur</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.id}</td>
                      <td>{event.title}</td>
                      <td>{event.organizer_email || 'N/A'}</td>
                      <td>{formatDate(event.date)}</td>
                      <td>
                        <span className={`event-status-badge ${eventStatusClass(event.status)}`}>
                          {eventStatusLabel(event.status)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-action btn-toggle"
                            onClick={() => toggleEventStatus(event)}
                          >
                            <FaExchangeAlt /> Changer statut
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => deleteEvent(event)}
                          >
                            <FaTrash /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      Aucun événement trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h2><FaCommentDots /> Modération des Commentaires</h2>
          <div className="section-search-wrap">
            <FaSearch className="search-icon-inline" />
            <input
              type="text"
              className="section-search"
              placeholder="Rechercher par événement ou auteur..."
              value={commentSearchTerm}
              onChange={(e) => setCommentSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Chargement des commentaires...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Auteur</th>
                  <th>Événement</th>
                  <th>Note</th>
                  <th>Extrait</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComments.length > 0 ? (
                  filteredComments.map((comment) => (
                    <tr key={comment.id}>
                      <td>
                        <span className="mongo-id" title={comment.id}>
                          {String(comment.id).slice(0, 10)}...
                        </span>
                      </td>
                      <td>{comment.author_email}</td>
                      <td>{comment.event_title}</td>
                      <td>
                        <span className="rating-stars" title={`${comment.rating}/5`}>
                          {renderStars(comment.rating)}
                        </span>
                      </td>
                      <td>
                        <span className="comment-excerpt" title={comment.content}>
                          {excerpt(comment.content)}
                        </span>
                      </td>
                      <td>{formatDate(comment.created_at)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-action btn-delete"
                            onClick={() => deleteComment(comment)}
                          >
                            <FaTrash /> Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      Aucun commentaire trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
