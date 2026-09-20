import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import MainLayout from "./layouts/MainLayout/MainLayout";

// Auth Pages
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";

// Main Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import PastInterviews from "./pages/PastInterviews/PastInterviews";
import InterviewReport from "./pages/InterviewReport/InterviewReport";
import ATSScore from "./pages/ATSScore/ATSScore";
import LiveInterview from "./pages/LiveInterview/LiveInterview";
import InterviewSetup from "./pages/InterviewSetup/InterviewSetup";

const App = () => {
  return (
    <Routes>
      {/* =========================
          AUTH ROUTES
      ========================= */}

      <Route path="/auth/login" element={<Login />} />

      <Route path="/auth/signup" element={<Signup />} />

      <Route path="/auth/forgot-password" element={<ForgotPassword />} />

      {/* =========================
          MAIN APPLICATION ROUTES
      ========================= */}

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/interviews" element={<PastInterviews />} />

        <Route path="/interviews/:id" element={<InterviewReport />} />

        <Route path="/ats-score" element={<ATSScore />} />

        <Route path="/interview-setup" element={<InterviewSetup />} />

        <Route path="/interview/:id" element={<LiveInterview />} />
      </Route>

      {/* =========================
          DEFAULT ROUTE
      ========================= */}

      <Route path="/" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default App;
