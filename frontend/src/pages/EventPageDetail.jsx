import React from 'react';
import { events } from '../data/mockData';
import '../styles/components.css';

function EventDetailPage({ eventId, onBack }) {
  const event = events.find(e => e.id === parseInt(eventId));

  if (!event) {
    return (
      <div className="detail-page">
        <button onClick={onBack} className="btn-back">← Retour au catalogue</button>
        <p>Événement non trouvé.</p>
      </div>
    );
  }

  const attendancePercent = Math.round((event.attendees / event.capacity) * 100);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button onClick={onBack} className="btn-back">← Retour au catalogue</button>
      </div>

      <div className="detail-container">
        <div className="detail-image-section">
          <img src={event.image} alt={event.title} className="detail-image" />
        </div>

        <div className="detail-content">
          <div className="detail-title-section">
            <span className="detail-category">{event.category}</span>
            <h1>{event.title}</h1>
          </div>

          <div className="detail-info-grid">
            <div className="info-block">
              <h3>📅 Date & Heure</h3>
              <p>{event.date}</p>
              <p>Début: {event.time}</p>
              <p>Durée: {event.duration}</p>
            </div>

            <div className="info-block">
              <h3>📍 Localisation</h3>
              <p>{event.location}</p>
            </div>

            <div className="info-block">
              <h3>💰 Tarif</h3>
              <p className="price">{event.price === 0 ? 'Gratuit' : `${event.price}€`}</p>
            </div>

            <div className="info-block">
              <h3>👥 Capacité</h3>
              <p>{event.attendees} / {event.capacity} participants</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${attendancePercent}%` }}
                />
              </div>
              <p>{attendancePercent}% complet</p>
            </div>
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>

          <div className="detail-actions">
            <button className="btn-primary">S'inscrire</button>
            <button className="btn-secondary">Ajouter aux favoris</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
