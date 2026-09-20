import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Logged-in user's full name from localStorage
  const userName = localStorage.getItem("username") || "User";

  const firstName = userName.split(" ")[0];
  const avatarLetter = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/auth/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* =========================
            BRAND - LEFT
        ========================= */}

        <NavLink to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">
            <img
              src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789569626/ChatGPT_Image_Sep_16_2026_08_10_16_PM.png"
              alt="HireMe.ai logo"
            />
          </div>

          <h2>
            HireMe <span>AI</span>
          </h2>
        </NavLink>

        {/* =========================
            DESKTOP CENTER NAVIGATION
        ========================= */}

        <nav className="navbar-center">
          <div className="navbar-links">
            <NavLink to="/dashboard" className="navbar-link">
              Dashboard
            </NavLink>

            <NavLink to="/interviews" className="navbar-link">
              Past Interviews
            </NavLink>

            <NavLink to="/ats-score" className="navbar-link">
              ATS Score
            </NavLink>
          </div>

          {/* Start Interview */}
          <NavLink to="/interview-setup" className="navbar-start-btn">
            <i className="fa-solid fa-microphone"></i>
            <span>Start Interview</span>
          </NavLink>
        </nav>

        {/* =========================
            DESKTOP RIGHT
        ========================= */}

        <div className="navbar-right">
          <div className="navbar-user">
            <div className="navbar-avatar">{avatarLetter}</div>

            <span>{firstName}</span>
          </div>

          <button
            type="button"
            className="navbar-logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>

        {/* =========================
            MOBILE RIGHT
        ========================= */}

        <div className="navbar-mobile-right">
          <div className="navbar-user">
            <div className="navbar-avatar">{avatarLetter}</div>

            <span>{userName}</span>
          </div>

          <button
            type="button"
            className="navbar-menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <i
              className={menuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}
            ></i>
          </button>
        </div>
      </div>

      {/* =========================
          MOBILE MENU
      ========================= */}

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <NavLink
            to="/dashboard"
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            <i className="fa-solid fa-house"></i>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/interviews"
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>Past Interviews</span>
          </NavLink>

          <NavLink
            to="/ats-score"
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            <i className="fa-solid fa-file-circle-check"></i>
            <span>ATS Score</span>
          </NavLink>

          <NavLink
            to="/interview/new"
            className="mobile-start-btn"
            onClick={closeMenu}
          >
            <i className="fa-solid fa-microphone"></i>
            <span>Start Interview</span>
          </NavLink>

          <button
            type="button"
            className="mobile-logout-btn"
            onClick={handleLogout}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
