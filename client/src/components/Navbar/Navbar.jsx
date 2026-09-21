import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ onMenuClick }) => {
  const [showNotification, setShowNotification] = useState(false);

  const userName = localStorage.getItem("username") || "User";

  const firstName = userName.split(" ")[0];
  const avatarLetter = userName.charAt(0).toUpperCase();

  const handleNotificationClick = () => {
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 2000);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* =========================
            MOBILE LEFT SECTION
        ========================= */}
        <div className="navbar-mobile-left">
          {/* Menu */}
          <button
            type="button"
            className="navbar-menu-btn"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <i className="fa-solid fa-bars"></i>
          </button>

          {/* Mobile Branding */}
          <NavLink
            to="/dashboard"
            className="navbar-mobile-brand"
            aria-label="HireMe.ai Dashboard"
          >
            <div className="navbar-mobile-logo">
              <img
                src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789569626/ChatGPT_Image_Sep_16_2026_08_10_16_PM.png"
                alt="HireMe.ai logo"
              />
            </div>

            <h2>
              HireMe <span>AI</span>
            </h2>
          </NavLink>
        </div>

        {/* =========================
            RIGHT SECTION
        ========================= */}
        <div className="navbar-right">
          {/* Notification */}
          <div className="navbar-notification-wrapper">
            <button
              type="button"
              className="navbar-icon-btn"
              onClick={handleNotificationClick}
              aria-label="Notifications"
              title="Notifications"
            >
              <i className="fa-regular fa-bell"></i>

              <span className="navbar-notification-dot"></span>
            </button>

            {showNotification && (
              <div className="navbar-notification-message">
                <i className="fa-regular fa-bell-slash"></i>
                <span>No new notifications</span>
              </div>
            )}
          </div>

          {/* User */}
          <div className="navbar-user">
            <div className="navbar-avatar">{avatarLetter}</div>

            <div className="navbar-user-info">
              <span className="navbar-user-name">{firstName}</span>

              <span className="navbar-user-label">Candidate</span>
            </div>

            <i className="fa-solid fa-chevron-down navbar-user-chevron"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
