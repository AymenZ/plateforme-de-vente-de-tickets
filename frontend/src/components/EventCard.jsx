import React from "react";
import { FiCalendar, FiMapPin } from "react-icons/fi";
import "../styles/components.css";

function EventCard({ event, onClick }) {

  return (
    <div className="poster-card" onClick={() => onClick(event.id)}>
      
      <div className="poster-image-container">
        <img
          src={event.image}
          alt={event.title}
          className="poster-image"
        />

        <div className="poster-price">
          {event.price === 0 ? "Gratuit" : `${event.price} TND`}
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
