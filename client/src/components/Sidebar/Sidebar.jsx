import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();

  const userName = localStorage.getItem("username") || "User";
  const avatarLetter = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/auth/login");
  };

  return (
    <aside
      className={`sidebar
        ${collapsed ? "sidebar-collapsed" : ""}
        ${mobileOpen ? "sidebar-mobile-open" : ""}
      `}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="sidebar-header">
        {/* Brand */}
        <NavLink
          to="/dashboard"
          className="sidebar-brand"
          onClick={onMobileClose}
        >
          <div className="sidebar-brand-logo">
            <img
              src="https://res.cloudinary.com/jwqnivpq/image/upload/v1789569626/ChatGPT_Image_Sep_16_2026_08_10_16_PM.png"
              alt="HireMe.ai logo"
            />
          </div>

          {!collapsed && (
            <h2>
              HireMe <span>AI</span>
            </h2>
          )}
        </NavLink>

        {/* =================================================
            DESKTOP COLLAPSE
        ================================================= */}
        {!collapsed && (
          <button
            type="button"
            className="sidebar-toggle sidebar-close-btn"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}

        {/* =================================================
            DESKTOP EXPAND
        ================================================= */}
        {collapsed && (
          <button
            type="button"
            className="sidebar-expand-btn"
            onClick={onToggle}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}

        {/* =================================================
            MOBILE CLOSE
        ================================================= */}
        {mobileOpen && (
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
            title="Close menu"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}
      <nav className="sidebar-navigation">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          onClick={onMobileClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
          title={collapsed ? "Dashboard" : ""}
        >
          <i className="fa-solid fa-house"></i>

          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* ATS Score */}
        <NavLink
          to="/ats-score"
          onClick={onMobileClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
          title={collapsed ? "ATS Score" : ""}
        >
          <i className="fa-solid fa-file-circle-check"></i>

          {!collapsed && <span>ATS Score</span>}
        </NavLink>

        {/* Start Interview */}
        <NavLink
          to="/interview-setup"
          onClick={onMobileClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
          title={collapsed ? "Start Interview" : ""}
        >
          <i className="fa-solid fa-microphone"></i>

          {!collapsed && <span>Start Interview</span>}
        </NavLink>

        {/* Past Interviews */}
        <NavLink
          to="/interviews"
          onClick={onMobileClose}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
          }
          title={collapsed ? "Past Interviews" : ""}
        >
          <i class="fa-solid fa-clock"></i>

          {!collapsed && <span>Past Interviews</span>}
        </NavLink>
      </nav>

      {/* =====================================================
          BOTTOM
      ===================================================== */}
      <div className="sidebar-bottom">
        {/* User */}
        <div
          className={`sidebar-user ${
            collapsed ? "sidebar-user-collapsed" : ""
          }`}
          title={collapsed ? userName : ""}
        >
          <div className="sidebar-avatar">{avatarLetter}</div>

          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{userName}</span>

              <span className="sidebar-user-label">User</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
        >
          <i className="fa-solid fa-right-from-bracket"></i>

          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
