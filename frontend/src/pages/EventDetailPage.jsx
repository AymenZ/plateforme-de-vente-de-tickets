import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import { 
  FaArrowLeft,FaHeart,FaRegHeart,FaShareAlt,FaCalendarAlt,FaMapMarkerAlt,FaUsers,FaClock,FaTag, FaWhatsapp, FaFacebookF, FaLink
} from "react-icons/fa";
import '../styles/components.css';
import '../styles/EventDetailPage.css';

function EventDetailPage({ eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [showShare, setShowShare] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

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

  const increase = (ticketId) => {
    setQuantities(prev => ({
      ...prev,
      [ticketId]: (prev[ticketId] || 0) + 1
    }));
  };

  const decrease = (ticketId) => {
    setQuantities(prev => ({
      ...prev,
      [ticketId]: Math.max((prev[ticketId] || 0) - 1, 0)
    }));
  };

  const addToCart = (ticket) => {
    const quantity = quantities[ticket.id] || 0;
    if (quantity === 0) return;

    const newItem = {
      id: Date.now(),
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventImage: event.image,
      ticketName: ticket.name,
      price: ticket.price,
      quantity,
    };

    setCart(prev => [...prev, newItem]);

    // reset quantity
    setQuantities(prev => ({ ...prev, [ticket.id]: 0 }));
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const totalTickets = cart.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

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
              {event.price === 0 ? "Gratuit" : `${event.price} TND`}
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

            {(event.tickets || []).map(ticket => (
              <div key={ticket.id} className="ticket-card">

                <div className="ticket-info">
                  <h4>{ticket.name}</h4>
                  <span className="ticket-price">
                    {ticket.price === 0 ? "Gratuit" : `${ticket.price} TND`}
                  </span>
                </div>

                <div className="quantity-selector">
                  <button onClick={() => decrease(ticket.id)}>-</button>
                  <span>{quantities[ticket.id] || 0}</span>
                  <button onClick={() => increase(ticket.id)}>+</button>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => addToCart(ticket)}
                >
                  Ajouter
                </button>

              </div>
            ))}
          </div>

        </div>
      </div>

      {/* FLOATING CART BUTTON */}
      {totalTickets > 0 && (
        <div className="floating-cart" onClick={() => setShowCart(true)}>
          🛒
          <span className="cart-badge">{totalTickets}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`cart-sidebar ${showCart ? "open" : ""}`}>

        <div className="cart-header">
          <h3>Billets ({totalTickets})</h3>
          <button onClick={() => setShowCart(false)}>✕</button>
        </div>

        <div className="cart-content">
          {cart.map(item => (
            <div key={item.id} className="cart-item">

              <img src={item.eventImage} alt="" />

              <div className="cart-item-info">
                <h4>{item.eventTitle}</h4>
                <p>{item.eventDate} — {item.eventTime}</p>
                <p>{item.ticketName}</p>
                <p>{item.quantity} × {item.price} TND</p>
              </div>

              <button
                className="delete-btn"
                onClick={() =>
                  setCart(cart.filter(c => c.id !== item.id))
                }
              >
                🗑
              </button>

            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            Total : {totalPrice} TND
          </div>

          <button
            className="clear-btn"
            onClick={() => setCart([])}
          >
            Vider le panier
          </button>

          <button className="checkout-btn">
            Valider la commande
          </button>
        </div>

      </div>
    </div>
  );
}

export default EventDetailPage;
