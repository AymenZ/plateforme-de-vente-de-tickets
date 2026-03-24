import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaCalendarAlt,
  FaUserShield,
  FaChartLine,
  FaSearch,
  FaSave,
  FaTrash,
} from 'react-icons/fa';
import '../styles/AdminPage.css';

function AdminPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRoles, setEditingRoles] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Normalise le rôle backend vers le front
  const normalizeRole = (roleName) => {
    if (!roleName) return 'client';
    const lower = roleName.toLowerCase();
    if (lower === 'organizer') return 'organizer';
    if (lower === 'admin') return 'admin';
    return 'client';
  };

  // Rôle front vers backend (uppercase)
  const toBackendRole = (role) => {
    const map = { client: 'CLIENT', organizer: 'ORGANIZER', admin: 'ADMIN' };
    return map[role] || 'CLIENT';
  };

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchUsers = async () => {
      try {
        const res = await usersAPI.listAll();
        const mapped = res.data.map(u => ({
          id: u.id,
          email: u.email,
          role: normalizeRole(u.role_name),
          role_name: u.role_name,
        }));
        setUsers(mapped);
      } catch (err) {
        setErrorMsg('Erreur lors du chargement des utilisateurs.');
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [user, token]);

  // Redirect if not admin
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

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    organizers: users.filter(u => u.role === 'organizer').length,
    events: 9,       // mock — sera lié plus tard
    revenue: '2,450', // mock — sera lié plus tard
  };

  const handleRoleChange = (userId, newRole) => {
    setEditingRoles(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveRole = async (userId) => {
    const newRole = editingRoles[userId];
    if (!newRole) return;

    try {
      await usersAPI.updateRole(userId, toBackendRole(newRole));

      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
      setEditingRoles(prev => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setSuccessMsg('Rôle mis à jour avec succès.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors de la mise à jour du rôle.';
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Supprimer l'utilisateur ${email} ?`)) return;

    try {
      await usersAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSuccessMsg('Utilisateur supprimé avec succès.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Erreur lors de la suppression.';
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-header">
        <h1>Administration</h1>
      </div>

      {/* Stats */}
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
            <h3>{stats.events}</h3>
            <p>Événements</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue"><FaChartLine /></div>
          <div className="stat-info">
            <h3>{stats.revenue} TND</h3>
            <p>Revenus</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="auth-success" style={{ maxWidth: '400px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="auth-error" style={{ maxWidth: '400px' }}>
          {errorMsg}
        </div>
      )}

      {/* Users Table */}
      <div className="admin-section">
        <div className="section-header">
          <h2><FaUsers /> Gestion des Utilisateurs</h2>
          <input
            type="text"
            className="section-search"
            placeholder="Rechercher par email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loadingUsers ? (
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
              filteredUsers.map(u => (
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

    </div>
  );
}

export default AdminPage;
