import React, { useState } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaUsers
} from "react-icons/fa";
import { FiCalendar, FiMapPin } from "react-icons/fi";
import "../styles/components.css";

function EventCard({ event, onClick }) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = `Check out ${event.title} on ${event.date} at ${event.location}!`;

    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: text,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Event copied to clipboard!");
    }
  };

  return (
    <div className="event-card-wrapper" onClick={() => onClick(event.id)}>
      <div className="event-card">

        {/* Image */}
        <div className="event-image-container">
          <img
            src={event.image}
            alt={event.title}
            className="event-image"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/400x250?text=Event";
            }}
          />
        </div>

        {/* Content */}
        <div className="event-card-content">

          <h3 className="event-title">{event.title}</h3>

          <div className="event-info">
            <p>
              <FiCalendar className="info-icon" />
              {event.date} à {event.time}
            </p>

            <p>
              <FiMapPin className="info-icon" />
              {event.location}
            </p>
          </div>

          {/* PRICE + CAPACITY CENTERED */}
          <div className="event-middle">
            <span className="event-price">
              {event.price === 0 ? "Gratuit" : `${event.price}€`}
            </span>

            <span className="event-attendees">
            <FaUsers className="info-icon" />
            {event.attendees}/{event.capacity}
            </span>

          </div>

          {/* ACTIONS */}
          <div className="event-actions">
            <div className="action-icons">
              <button
                className="icon-btn share-icon"
                onClick={handleShare}
                aria-label="Share"
              >
                <FaShareAlt />
              </button>

              <button
                className={`icon-btn like-icon ${isFavorite ? "active" : ""}`}
                onClick={handleFavorite}
                aria-label="Like"
              >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>

            <span className="event-category">
              {event.category}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EventCard;
