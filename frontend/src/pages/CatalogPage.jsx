import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import FilterBar from '../components/FilterBar';
import '../styles/components.css';
import '../styles/CatalogPage.css';

function CatalogPage({ onEventSelect }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(500);

  const normalizeStatus = (status = '') => (
    String(status)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
  );

  const isFinishedEvent = (event) => {
    const normalizedStatus = normalizeStatus(event?.status);
    if (normalizedStatus === 'termine' || normalizedStatus === 'finished') {
      return true;
    }

    const eventDate = new Date(event?.date || '');
    if (Number.isNaN(eventDate.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate < today;
  };

  // Charger les événements depuis l'API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsAPI.getAll();
        const publishedEvents = (res.data || []).filter((event) => {
          const normalizedStatus = normalizeStatus(event?.status);
          const isPublished = normalizedStatus === 'publie' || normalizedStatus === 'published';
          return isPublished && !isFinishedEvent(event);
        });

        setEvents(publishedEvents);
        // Extraire les catégories uniques
        const cats = [...new Set(publishedEvents.map(e => e.category).filter(Boolean))];
        setCategories(cats);
      } catch (err) {
        console.error('Erreur lors du chargement des événements :', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filtrer les événements selon les critères
  const filteredEvents = events.filter(event => {
  if (isFinishedEvent(event)) return false;

  const ticketPrices = (event.tickets || [])
    .map((t) => Number(t.price))
    .filter((p) => !Number.isNaN(p));
  const basePrice = ticketPrices.length > 0
    ? Math.min(...ticketPrices)
    : Number(event.price || 0);

  const matchCategory =
    selectedCategories.length === 0 ||
    selectedCategories.includes(event.category);

  const matchPrice = basePrice <= maxPrice;

  const matchSearch =
    (event.title || '').toLowerCase().includes(searchTerm.toLowerCase());

  return matchCategory && matchPrice && matchSearch;
  });

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Découvrez nos Événements</h1>
      </div>
      
      <FilterBar
        categories={categories}
        selectedCategories={selectedCategories}
        searchTerm={searchTerm}
        maxPrice={maxPrice}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategories}
        onMaxPriceChange={setMaxPrice}
      />

      <div className="events-container">
        <div className="events-grid">
          {loading ? (
            <p className="no-results">Chargement des événements...</p>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => onEventSelect(event.id)}
              />
            ))
          ) : (
            <p className="no-results">
              Aucun événement ne correspond à vos filtres.
            </p>
          )}
        </div>
      </div>

      <div className="results-info">
        <p className="results-count">
          Affichage {filteredEvents.length} événement(s) sur {events.length}
        </p>
      </div>
    </div>
  );
}

export default CatalogPage;
