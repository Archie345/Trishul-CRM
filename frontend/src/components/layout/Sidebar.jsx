import {
  FaTachometerAlt,
  FaUsers,
  FaUserFriends,
  FaTasks,
  FaStickyNote,
  FaChartBar,
  FaRobot,
  FaCog,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/api";

const menu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <FaTachometerAlt />,
    roles: ["admin", "supervisor", "employee"],
  },
  {
    name: "Leads",
    path: "/leads",
    icon: <FaUsers />,
    roles: ["admin", "supervisor", "employee"],
  },
  {
    name: "Customers",
    path: "/customers",
    icon: <FaUserFriends />,
    roles: ["admin", "supervisor", "employee"],
  },
  {
    name: "Tasks",
    path: "/tasks",
    icon: <FaTasks />,
    roles: ["admin", "supervisor", "employee"],
  },
  {
    name: "Employees",
    path: "/employees",
    icon: <FaUsers />,
    roles: ["admin"],
  },
  {
    name: "Notes",
    path: "/notes",
    icon: <FaStickyNote />,
    roles: ["admin", "supervisor", "employee"],
  },
  {
    name: "Reports",
    path: "/reports",
    icon: <FaChartBar />,
    roles: ["admin", "supervisor"],
  },
  {
    name: "AI Assistant",
    path: "/ai",
    icon: <FaRobot />,
    roles: ["admin", "supervisor"],
  },
  {
    name: "Settings",
    path: "/settings",
    icon: <FaCog />,
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRole(response.data.role);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const visibleMenu = menu.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 text-white shadow-xl">

      {/* Logo */}
      <div className="p-6 text-center border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">
          Trishul CRM
        </h1>

        <p className="text-sm text-slate-400">
          Smart Business Management
        </p>
      </div>

      
      {/* Navigation */}
      <nav className="mt-4 px-3">
        {visibleMenu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
              location.pathname === item.path
                ? "bg-blue-600"
                : "hover:bg-slate-800"
            }`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>

    </aside>
  );
}