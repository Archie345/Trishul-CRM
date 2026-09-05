import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import SplashScreen from "./components/SplashScreen";
import CRMLayout from "./components/CRMLayout";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Tasks from "./pages/Tasks";
import Notes from "./pages/Notes";
import Reports from "./pages/Reports";
import AI from "./pages/AI";
import Settings from "./pages/Settings";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      {/* First page after Splash Screen */}
      <Route path="/" element={<Register />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Register page */}
      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Application pages */}
      <Route element={<CRMLayout />}>

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/leads" element={<Leads />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/ai" element={<AI />} />
      <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;