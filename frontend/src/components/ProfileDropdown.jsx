import { useEffect, useState } from "react";
import { FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          return;
        }

        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Logged-in user:", response.data);

        setUser(response.data);
      } catch (error) {
        console.error(
          "Failed to fetch user:",
          error.response?.data || error.message
        );
      }
    };

    fetchCurrentUser();
  }, []);

  const getRoleLabel = (role) => {
    if (!role) return "User";

    switch (role.toLowerCase()) {
      case "admin":
        return "Administrator";

      case "supervisor":
        return "Supervisor";

      case "employee":
        return "User";

      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3"
      >
        <FaUserCircle
          size={38}
          className="text-blue-400"
        />

        <div className="text-left">
          <p className="text-white font-semibold">
            {user?.full_name || "User"}
          </p>

          <p className="text-sm text-slate-400">
            {getRoleLabel(user?.role)}
          </p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-56 bg-slate-900 rounded-xl shadow-xl border border-slate-700 z-50">

          <button
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800 text-white"
          >
            <FaUserCircle />
            My Profile
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-800 text-white"
          >
            <FaCog />
            Settings
          </button>

          <button
            onClick={logout}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-600 text-white rounded-b-xl"
          >
            <FaSignOutAlt />
            Logout
          </button>

        </div>
      )}

    </div>
  );
}