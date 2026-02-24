import React, { useState } from 'react';
import { events, categories } from '../data/mockData';
import EventCard from '../components/EventCard';
import FilterBar from '../components/FilterBar';
import '../styles/components.css';
import '../styles/CatalogPage.css';

function CatalogPage({ onEventSelect }) {
  //const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [maxPrice, setMaxPrice] = useState(500);

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
