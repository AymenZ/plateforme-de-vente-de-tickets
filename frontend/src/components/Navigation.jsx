import React, { useState } from "react";
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
} from "react-icons/fa";

function Navigation({
  onLogoClick,
  userType = null,
  onLoginClick,
  onSignupClick,
  onLogoutClick,
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cartCount] = useState(2);
  const [likesCount] = useState(1);

  return (
    <nav className="navigation">
      <div className="nav-left">
        <h1 className="nav-logo" onClick={onLogoClick}>
           EventHub 🇹🇳
        </h1>
      </div>

      <div className={`nav-right ${userType === "client" ? "nav-client" : ""}`}>

        {/* 🔹 Déconnecté */}
        {!userType && (
          <>
            <button className="nav-btn nav-login" onClick={onLoginClick}>
              <FaSignInAlt /> Connexion
            </button>

            <button className="nav-btn nav-signup" onClick={onSignupClick}>
              <FaUserPlus /> Inscription
            </button>
          </>
        )}

        {/* 🔹 Client */}
        {userType === "client" && (
          <>
            <button className="nav-btn nav-browse">
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
                <FaUser />
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
                    onClick={onLogoutClick}
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
            <button className="nav-btn nav-primary">
              <FaChartBar /> Dashboard
            </button>

            <button className="nav-btn nav-create">
              <FaPlus /> Créer
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
                  <button className="dropdown-item">
                    <FaTicketAlt /> Mes Événements
                  </button>

                  <button className="dropdown-item">
                    <FaChartBar /> Statistiques
                  </button>

                  <hr className="dropdown-divider" />

                  <button
                    className="dropdown-item logout-btn"
                    onClick={onLogoutClick}
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
            <button className="nav-btn nav-admin">
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
                  <button className="dropdown-item">
                    <FaUsers /> Gestion Utilisateurs
                  </button>

                  <button className="dropdown-item">
                    <FaTicketAlt /> Gestion Événements
                  </button>

                  <hr className="dropdown-divider" />

                  <button
                    className="dropdown-item logout-btn"
                    onClick={onLogoutClick}
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
