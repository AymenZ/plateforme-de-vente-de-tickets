import React from "react";
import {
  FaSearch,
  FaMusic,
  FaFilm,
  FaUtensils,
  FaFutbol,
  FaTheaterMasks,
  FaChild,
  FaGamepad,
  FaChartBar,
} from "react-icons/fa";
import "../styles/components.css";

function FilterBar({
  categories,
  selectedCategories,
  searchTerm,
  maxPrice,
  onSearchChange,
  onCategoryChange,
  onMaxPriceChange,
}) {

  const categoryIcons = {
    Musique: <FaMusic />,
    Cinéma: <FaFilm />,
    Cuisine: <FaUtensils />,
    Sport: <FaFutbol />,
    Théâtre: <FaTheaterMasks />,
    Famille: <FaChild />,
    Culture: <FaTheaterMasks />,
    Conférence: <FaChartBar />,
    "Tech/Gaming": <FaGamepad />,
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(
        selectedCategories.filter((cat) => cat !== category)
      );
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="modern-filter">

      <div className="filter-top">

        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>

        <div className="price-box">
          <span className="price-label">
            {`${maxPrice}€`}
          </span>
          <input
            type="range"
            min="0"
            max="500"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(parseInt(e.target.value))}
            className="modern-range"
            style={{
              background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${(maxPrice / 500) * 100}%, #e5e7eb ${(maxPrice / 500) * 100}%, #e5e7eb 100%)`
            }}
          />
        </div>

        <button
          className="reset-btn"
          onClick={() => {
            onCategoryChange([]);
            onMaxPriceChange(500);
            onSearchChange("");
          }}
        >
          Réinitialiser
        </button>

      </div>

      <div className="category-buttons">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${
              selectedCategories.includes(cat) ? "active" : ""
            }`}
            onClick={() => toggleCategory(cat)}
          >
            {categoryIcons[cat] && categoryIcons[cat]}
            {cat}
          </button>
        ))}
      </div>

    </div>
  );
}

export default FilterBar;