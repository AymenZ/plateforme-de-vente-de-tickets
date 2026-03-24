import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsAPI } from "../services/api";
import {
  FaShoppingCart,
  FaUser,
  FaPlus,
  FaCog,
  FaSignOutAlt,
  FaRegHeart,
  FaSignInAlt,
  FaUserPlus,
  FaTicketAlt,
  FaChartBar,
  FaUsers,
  FaRegUser,
} from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import "../styles/components.css";

function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartCount] = useState(2);
  const [likesCount] = useState(1);

  const userType = user?.role || null;

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };

  const exportToCSV = async () => {
    try {
      const res = await eventsAPI.getMyEvents();
      const myEvents = res.data;

      const headers = [
        "Title",
        "Category",
        "Date",
        "Status",
        "Capacity",
        "Price",
      ];

      const rows = myEvents.map((event) => [
        event.title,
        event.category,
        event.date,
        event.status || "—",
        event.capacity,
        event.price,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers, ...rows].map((e) => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "organizer_events.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Erreur export CSV:", err);
      alert("Impossible d'exporter les événements.");
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-left">
        <h1 className="nav-logo" onClick={() => navigate("/")}>
           EventHub 🇹🇳
        </h1>
      </div>

      <div className={`nav-right ${isAuthenticated() ? "nav-client" : ""}`}>

        {/* 🔹 Déconnecté */}
        {!isAuthenticated() && (
          <>
            <button className="nav-btn nav-login" onClick={() => navigate("/login")}>
              <FaSignInAlt /> Connexion
            </button>

            <button className="nav-btn nav-signup" onClick={() => navigate("/register")}>
              <FaUserPlus /> Inscription
            </button>
          </>
        )}

        {/* 🔹 Client */}
        {userType === "client" && (
          <>
            <button className="nav-btn nav-browse" onClick={() => navigate("/")}>
              <FaTicketAlt /> Parcourir
            </button>

            <button className="nav-icon-btn">
              <FaShoppingCart />
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </button>

            <button className="nav-icon-btn">
              <FaRegHeart />
              {likesCount > 0 && (
                <span className="likes-badge">{likesCount}</span>
              )}
            </button>

            <div className="nav-profile">
              <button
                className="nav-avatar"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <FaRegUser />
              </button>

              {isProfileOpen && (
                <div className="nav-dropdown">
                  <button className="dropdown-item">
                    <FaUser /> Mon Profil
                  </button>

                  <button className="dropdown-item">
                    <FaTicketAlt /> Mes Réservations
                  </button>

                  <hr className="dropdown-divider" />

                  <button
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* 🔹 Organisateur */}
        {userType === "organizer" && (
          <>
            <button className="nav-btn nav-primary" onClick={() => navigate("/dashboard")}>
              <FaChartBar /> Dashboard
            </button>

            <button className="nav-btn nav-export" onClick={exportToCSV}>
              <FaTicketAlt /> Export CSV
            </button>

            <NotificationBell />

            <div className="nav-profile">
              <button
                className="nav-avatar"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <FaUser />
              </button>

              {isProfileOpen && (
                <div className="nav-dropdown">
                  <button className="dropdown-item" onClick={() => { navigate("/dashboard"); setIsProfileOpen(false); }}>
                    <FaTicketAlt /> Mes Événements
                  </button>

                  <hr className="dropdown-divider" />

                  <button
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* 🔹 Admin */}
        {userType === "admin" && (
          <>
            <button className="nav-btn nav-admin" onClick={() => navigate("/admin")}>
              <FaCog /> Administration
            </button>

            <div className="nav-profile">
              <button
                className="nav-avatar"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <FaUser />
              </button>

              {isProfileOpen && (
                <div className="nav-dropdown">
                  <button className="dropdown-item" onClick={() => { navigate("/admin"); setIsProfileOpen(false); }}>
                    <FaUsers /> Gestion Utilisateurs
                  </button>

                  <button className="dropdown-item" onClick={() => { navigate("/"); setIsProfileOpen(false); }}>
                    <FaTicketAlt /> Gestion Événements
                  </button>

                  <hr className="dropdown-divider" />

                  <button
                    className="dropdown-item logout-btn"
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
