import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  FaClock,
  FaDownload,
  FaExclamationTriangle,
  FaIdCard,
  FaReceipt,
  FaSyncAlt,
  FaTicketAlt,
} from 'react-icons/fa';

import { useAuth } from '../context/AuthContext';
import { ordersAPI, ticketsAPI } from '../services/api';
import '../styles/ProfilePage.css';

function formatDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('fr-FR');
}

function formatAmount(amount, currency) {
  const value = Number(amount || 0);
  const code = (currency || 'USD').toUpperCase();

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

function statusClass(status) {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'PAID' || normalized === 'VALID') return 'ok';
  if (normalized === 'PENDING' || normalized === 'PENDING_PAYMENT') return 'pending';
  return 'neutral';
}

function normalizeStatus(status) {
  return String(status || '').trim().toUpperCase();
}

function formatUnitPrice(amount) {
  return `${Number(amount || 0).toFixed(2)}`;
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canAccessTickets = user?.role === 'client' || user?.role === 'admin';

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => (order.payment_status || '').toUpperCase() === 'PAID');
    const totalSpent = paidOrders.reduce((acc, order) => acc + Number(order.total_amount || 0), 0);

    return {
      ticketsCount: tickets.length,
      ordersCount: orders.length,
      paidOrdersCount: paidOrders.length,
      totalSpent,
      currency: paidOrders[0]?.payment_currency || orders[0]?.payment_currency || 'usd',
    };
  }, [orders, tickets]);

  const downloadTicketAsPdf = async (ticket) => {
    try {
      const qrImage = await QRCode.toDataURL(ticket.qr_value, {
        width: 220,
        margin: 1,
      });

      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(14, 116, 144);
      doc.rect(0, 0, pageWidth, 92, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Eventi Ticket', 40, 56);
      doc.setFontSize(12);
      doc.text(ticket.ticket_code, 40, 76);

      doc.setDrawColor(226, 232, 240);
      doc.line(35, 112, pageWidth - 35, 112);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      let y = 140;
      doc.text(`Event: ${ticket.event_title}`, 40, y);
      y += 22;
      doc.text(`Ticket: ${ticket.ticket_name}`, 40, y);
      y += 22;
      doc.text(`Status: ${ticket.status}`, 40, y);
      y += 22;
      doc.text(`Purchased At: ${formatDate(ticket.purchased_at)}`, 40, y);
      y += 22;
      doc.text(`Price: ${formatUnitPrice(ticket.unit_price)}`, 40, y);

      doc.addImage(qrImage, 'PNG', 40, 258, 170, 170);

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      const qrLines = doc.splitTextToSize(ticket.qr_value, pageWidth - 80);
      doc.text(qrLines, 40, 452);

      doc.save(`ticket-${ticket.ticket_code}.pdf`);
    } catch (err) {
      console.error('Erreur téléchargement ticket:', err);
      alert('Impossible de télécharger ce ticket pour le moment.');
    }
  };

  const fetchData = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    if (!canAccessTickets) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [ticketsRes, ordersRes] = await Promise.all([
        ticketsAPI.getMy(),
        ordersAPI.getMyOrders(),
      ]);

      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, canAccessTickets]);

  if (authLoading || loading) {
    return (
      <div className="profile-page">
        <div className="profile-shell loading-state">
          <FaClock className="spin" /> Chargement du profil...
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="profile-page">
        <div className="profile-shell state-card">
          <h2>Connexion requise</h2>
          <p>Connectez-vous pour voir vos billets et votre historique de commandes.</p>
          <button className="profile-btn" onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (!canAccessTickets) {
    return (
      <div className="profile-page">
        <div className="profile-shell state-card">
          <h2>Section client uniquement</h2>
          <p>Votre rôle actuel ne permet pas l'accès aux billets d'achat client.</p>
          <button className="profile-btn" onClick={() => navigate('/')}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-header">
          <div>
            <h1><FaIdCard /> Mon Profil Client</h1>
            <p>{user?.email}</p>
          </div>
          <button className="profile-btn ghost" onClick={fetchData}>
            <FaSyncAlt /> Actualiser
          </button>
        </div>

        {error && (
          <div className="profile-error">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        <section className="profile-stats-grid">
          <article className="profile-stat-card">
            <span>Billets achetés</span>
            <strong>{stats.ticketsCount}</strong>
          </article>

          <article className="profile-stat-card">
            <span>Commandes totales</span>
            <strong>{stats.ordersCount}</strong>
          </article>

          <article className="profile-stat-card">
            <span>Commandes payées</span>
            <strong>{stats.paidOrdersCount}</strong>
          </article>

          <article className="profile-stat-card">
            <span>Total dépensé</span>
            <strong>{formatAmount(stats.totalSpent, stats.currency)}</strong>
          </article>
        </section>

        <section className="profile-section">
          <div className="profile-section-title">
            <h2><FaTicketAlt /> Mes Tickets + QR</h2>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-card">Aucun ticket généré pour le moment.</div>
          ) : (
            <div className="ticket-grid">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="ticket-card">
                  <div className="ticket-head">
                    <div>
                      <h3>{ticket.event_title}</h3>
                      <p>{ticket.ticket_name}</p>
                    </div>
                    <span className={`status-badge ${statusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="ticket-code">Code: {ticket.ticket_code}</div>

                  <div className="ticket-meta">
                    <span>Acheté: {formatDate(ticket.purchased_at)}</span>
                    <span>Prix: {formatUnitPrice(ticket.unit_price)}</span>
                  </div>

                  <div className="ticket-qr-wrap">
                    <QRCodeSVG value={ticket.qr_value} size={128} includeMargin level="M" />
                    <small>{ticket.qr_value}</small>
                  </div>

                  <button
                    type="button"
                    className="ticket-download-btn"
                    onClick={() => downloadTicketAsPdf(ticket)}
                  >
                    <FaDownload /> Télécharger PDF
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="profile-section" id="orders">
          <div className="profile-section-title">
            <h2><FaReceipt /> Historique des Commandes</h2>
          </div>

          {orders.length === 0 ? (
            <div className="empty-card">Vous n'avez pas encore de commandes.</div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const normalizedOrderStatus = normalizeStatus(order.status);
                const normalizedPaymentStatus = normalizeStatus(order.payment_status);
                const showPaymentStatus = Boolean(normalizedPaymentStatus);
                const showOrderStatus = Boolean(normalizedOrderStatus)
                  && (!showPaymentStatus || normalizedOrderStatus !== normalizedPaymentStatus);

                return (
                <article key={order.id} className="order-card">
                  <div className="order-top-row">
                    <div>
                      <h3>Commande #{order.id}</h3>
                      <p>Créée le {formatDate(order.created_at)}</p>
                    </div>

                    <div className="order-status-wrap">
                      {showOrderStatus && (
                        <span className={`status-badge ${statusClass(normalizedOrderStatus)}`}>
                          {normalizedOrderStatus}
                        </span>
                      )}
                      {showPaymentStatus && (
                        <span className={`status-badge ${statusClass(normalizedPaymentStatus)}`}>
                          {normalizedPaymentStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="order-summary-grid">
                    <div>
                      <span>Articles</span>
                      <strong>{(order.items || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}</strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{formatAmount(order.total_amount, order.payment_currency)}</strong>
                    </div>
                    <div>
                      <span>Payée le</span>
                      <strong>{formatDate(order.paid_at)}</strong>
                    </div>
                  </div>

                  <div className="order-lines">
                    {(order.items || []).map((item) => (
                      <div key={item.id} className="order-line">
                        <span>{item.event_title} - {item.ticket_name}</span>
                        <strong>
                          {item.quantity} x {formatAmount(item.unit_price, order.payment_currency)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
