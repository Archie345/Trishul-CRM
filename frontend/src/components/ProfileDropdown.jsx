import { useState } from "react";
import { FaUserCircle, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
            Admin
          </p>

          <p className="text-sm text-slate-400">
            Administrator
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