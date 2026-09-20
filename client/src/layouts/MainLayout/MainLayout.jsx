import { Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Navbar />

      <main className="main-layout-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
