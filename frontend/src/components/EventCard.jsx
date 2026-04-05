import React from "react";
import { FiCalendar, FiMapPin } from "react-icons/fi";
import "../styles/components.css";

function EventCard({ event, onClick }) {
  const ticketPrices = (event.tickets || [])
    .map((t) => Number(t.price))
    .filter((p) => !Number.isNaN(p));
  const displayedPrice = ticketPrices.length > 0
    ? Math.min(...ticketPrices)
    : Number(event.price || 0);

  return (
    <div className="poster-card" onClick={() => onClick(event.id)}>
      
      <div className="poster-image-container">
        <img
          src={event.image}
          alt={event.title}
          className="poster-image"
        />

        <div className="poster-price">
          {displayedPrice === 0 ? "Gratuit" : `${displayedPrice} TND`}
        </div>
      </div>

      <div className="poster-info">
        <h3>{event.title}</h3>

        <p className="poster-date">
          <FiCalendar /> {event.date} à {event.time}
        </p>

        <p className="poster-location">
          <FiMapPin /> {event.location}
        </p>
      </div>

    </div>
  );
}

export default EventCard;
