import React, { useState } from 'react';
import { events, categories } from '../data/mockData';
import EventCard from '../components/EventCard';
import FilterBar from '../components/FilterBar';
import '../styles/components.css';

function CatalogPage({ onEventSelect }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [maxPrice, setMaxPrice] = useState(Infinity);

  // Filtrer les événements selon les critères
  const filteredEvents = events.filter(event => {
    const matchCategory = !selectedCategory || event.category === selectedCategory;
    const matchPrice = event.price <= maxPrice;
    return matchCategory && matchPrice;
  });

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Découvrez nos Événements</h1>
      </div>
      
      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        maxPrice={maxPrice}
        onCategoryChange={setSelectedCategory}
        onMaxPriceChange={setMaxPrice}
      />

      <div className="events-container">
        <div className="events-grid">
          {filteredEvents.length > 0 ? (
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
