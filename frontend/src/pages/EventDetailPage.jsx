import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  FaArrowLeft,FaHeart,FaRegHeart,FaShareAlt,FaCalendarAlt,FaMapMarkerAlt,FaUsers,FaClock,FaTag, FaWhatsapp, FaFacebookF, FaLink
} from "react-icons/fa";
import '../styles/components.css';
import '../styles/EventDetailPage.css';

function EventDetailPage({ eventId, onBack }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartItemCount } = useCart();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [showShare, setShowShare] = useState(false);
  const [addingTicketId, setAddingTicketId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventsAPI.getById(eventId);
        setEvent(res.data);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'événement :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const increase = (ticketId, available) => {
    setQuantities(prev => ({
      ...prev,
      [ticketId]: Math.min((prev[ticketId] || 0) + 1, Math.max(available, 0))
    }));
  };

  const decrease = (ticketId) => {
    setQuantities(prev => ({
      ...prev,
      [ticketId]: Math.max((prev[ticketId] || 0) - 1, 0)
    }));
  };

  const handleAddToCart = async (ticket, stateKey) => {
    if (!isAuthenticated() || (user?.role !== 'client' && user?.role !== 'admin')) {
      navigate('/login');
      return;
    }

    if (!ticket.id) {
      setFeedback('Ce type de ticket est invalide (id manquant).');
      return;
    }

    const quantity = quantities[stateKey] || 0;
    const available = Math.max((ticket.quantity || 0) - (ticket.sold || 0), 0);
    if (quantity < 1) {
      setFeedback('Choisissez une quantité avant d\'ajouter au panier.');
      return;
    }
    if (quantity > available) {
      setFeedback('Stock insuffisant pour cette quantité.');
      return;
    }

    try {
      setAddingTicketId(stateKey);
      await addToCart(ticket.id, quantity);
      setFeedback(`Ajouté: ${quantity} x ${ticket.name}`);
      setQuantities((prev) => ({ ...prev, [stateKey]: 0 }));
    } catch (err) {
      setFeedback(err.response?.data?.detail || 'Impossible d\'ajouter cet article au panier');
    } finally {
      setAddingTicketId(null);
    }
  };

  const ticketPrices = (event?.tickets || [])
    .map((t) => Number(t.price))
    .filter((p) => !Number.isNaN(p));
  const displayedPrice = ticketPrices.length > 0
    ? Math.min(...ticketPrices)
    : Number(event?.price || 0);

  if (loading) {
    return (
      <div className="detail-page">
        <button onClick={onBack} className="btn-back"><FaArrowLeft /></button>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="detail-page">
        <button onClick={onBack} className="btn-back"><FaArrowLeft /></button>
        <p>Événement non trouvé.</p>
      </div>
    );
  }

  //const attendancePercent = Math.round((event.attendees / event.capacity) * 100);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button onClick={onBack} className="btn-back">
        <FaArrowLeft />
        </button>
      </div>

      <div className="detail-container">

        {/* LEFT SIDE */}
        <div className="detail-left">

          <div className="image-wrapper">
            <img src={event.image} alt={event.title} className="detail-image" />

            {/* PRICE BADGE */}
            <div className="price-badge">
              {displayedPrice === 0 ? "Gratuit" : `A partir de ${displayedPrice} TND`}
            </div>

            {/* ACTION BUTTONS */}
            <div className="image-actions">
              <button 
                className={`icon-btn heart-btn ${liked ? "liked" : ""}`}
                onClick={() => setLiked(!liked)}
              >
                {liked ? <FaHeart /> : <FaRegHeart />}
              </button>

              <button className="icon-btn" onClick={() => setShowShare(!showShare)}>
                <FaShareAlt />
              </button>
            </div>

            {showShare && (
  <div className="share-popup">
    <a
      href={`https://wa.me/?text=${window.location.href}`}
      target="_blank"
      rel="noreferrer"
      className="share-item whatsapp"
    >
      <FaWhatsapp />
      <span>WhatsApp</span>
    </a>

    <a
      href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
      target="_blank"
      rel="noreferrer"
      className="share-item facebook"
    >
      <FaFacebookF />
      <span>Facebook</span>
    </a>

    <button
      className="share-item copy"
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
      }}
    >
      <FaLink />
      <span>Copier le lien</span>
    </button>
  </div>
)}
          </div>

          {/* DESCRIPTION */}
          <div className="about-section">
            <h3>À propos de l'événement</h3>
            <p>{event.description}</p>
            <p className="extra-info"><strong>{event.extra_info}</strong></p>
          </div>

          {/* MAP */}
          <div className="map-section">
            <h3>Emplacement</h3>
            <iframe
              title="map"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: "10px" }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${encodeURIComponent(event.location)}&output=embed`}
            ></iframe>
          </div>

        </div>


        {/* RIGHT SIDE */}
        <div className="detail-right">

          <h1>{event.title}</h1>

          <div className="info-list">

            <div className="info-item">
              <FaCalendarAlt />
              <span>{event.date} — {event.time}</span>
            </div>

            <div className="info-item">
              <FaMapMarkerAlt />
              <span>{event.location}</span>
            </div>

            <div className="info-item">
              <FaClock />
              <span>Durée : {event.duration}</span>
            </div>

            <div className="info-item">
              <FaUsers />
              <span>{event.attendees} / {event.capacity} participants</span>
            </div>

            <div className="info-item">
              <FaTag />
              <span>Âge minimum : {event.age_min} ans</span>
            </div>

          </div>

          {/* TICKET SECTION */}
          <div className="ticket-section">
            <h3>Billets disponibles</h3>

            {feedback && <p className="detail-feedback">{feedback}</p>}

            {(event.tickets || []).map((ticket, index) => {
              const ticketKey = ticket.id ?? `${ticket.name}-${index}`;
              const available = Math.max((ticket.quantity || 0) - (ticket.sold || 0), 0);
              const selectedQty = quantities[ticketKey] || 0;

              return (
              <div key={ticketKey} className={`ticket-card ${available <= 0 ? 'sold-out' : ''}`}>

                <div className="ticket-info">
                  <h4>{ticket.name}</h4>
                  <span className="ticket-price">
                    {ticket.price === 0 ? "Gratuit" : `${ticket.price} TND`}
                  </span>
                  <small className="ticket-availability">
                    Stock restant: {available}
                  </small>
                </div>

                <div className="quantity-selector">
                  <button onClick={() => decrease(ticketKey)} disabled={available <= 0}>-</button>
                  <span>{selectedQty}</span>
                  <button onClick={() => increase(ticketKey, available)} disabled={available <= 0}>+</button>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => handleAddToCart(ticket, ticketKey)}
                  disabled={available <= 0 || addingTicketId === ticketKey}
                >
                  {available <= 0 ? 'Rupture' : (addingTicketId === ticketKey ? 'Ajout...' : 'Ajouter')}
                </button>

              </div>
            )})}

            {(event.tickets || []).length === 0 && (
              <p>Aucun type de ticket n'est encore configuré pour cet événement.</p>
            )}
          </div>

        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      {cartItemCount > 0 && (
        <div className="floating-cart" onClick={() => navigate('/cart')}>
          🛒
          <span className="cart-badge">{cartItemCount}</span>
        </div>
      )}
    </div>
  );
}

export default EventDetailPage;
