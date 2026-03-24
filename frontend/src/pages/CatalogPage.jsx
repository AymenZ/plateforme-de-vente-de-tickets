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

  // Charger les événements depuis l'API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsAPI.getAll();
        setEvents(res.data);
        // Extraire les catégories uniques
        const cats = [...new Set(res.data.map(e => e.category).filter(Boolean))];
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
  const matchCategory =
    selectedCategories.length === 0 ||
    selectedCategories.includes(event.category);

  const matchPrice = event.price <= maxPrice;

  const matchSearch =
    event.title.toLowerCase().includes(searchTerm.toLowerCase());

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
