import { useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import Footer from "../../components/Footer/Footer";

import "./MainLayout.css";

const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Desktop sidebar collapse / expand
  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Mobile sidebar open
  const handleMobileMenuOpen = () => {
    setMobileSidebarOpen(true);
  };

  // Mobile sidebar close
  const handleMobileMenuClose = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div
      className={`main-layout ${
        sidebarCollapsed ? "sidebar-is-collapsed" : ""
      }`}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={handleMobileMenuClose}
      />

      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={handleMobileMenuClose}
          aria-hidden="true"
        />
      )}

      {/* =====================================================
          MAIN AREA
      ===================================================== */}
      <div className="main-layout-area">
        <Navbar onMenuClick={handleMobileMenuOpen} />

        <main className="main-layout-content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
