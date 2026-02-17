import React from 'react';
import '../styles/components.css';

function FilterBar({ categories, selectedCategory, maxPrice, onCategoryChange, onMaxPriceChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="category-filter">Catégorie:</label>
        <select
          id="category-filter"
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="filter-select"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="price-filter">Prix Max: {maxPrice === Infinity ? 'Illimité' : `${maxPrice}€`}</label>
        <input
          id="price-filter"
          type="range"
          min="0"
          max="300"
          value={maxPrice === Infinity ? 300 : maxPrice}
          onChange={(e) => onMaxPriceChange(parseInt(e.target.value))}
          className="filter-range"
        />
      </div>

      <button 
        className="filter-reset"
        onClick={() => {
          onCategoryChange(null);
          onMaxPriceChange(Infinity);
        }}
      >
        Réinitialiser filtres
      </button>
    </div>
  );
}

export default FilterBar;
