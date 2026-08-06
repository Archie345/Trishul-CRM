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

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
  { name: "Leads", path: "/leads", icon: <FaUsers /> },
  { name: "Customers", path: "/customers", icon: <FaUserFriends /> },
  { name: "Tasks", path: "/tasks", icon: <FaTasks /> },
  { name: "Employees", path: "/employees", icon: <FaUserFriends />},
  { name: "Notes", path: "/notes", icon: <FaStickyNote /> },
  { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  { name: "AI Assistant", path: "/ai", icon: <FaRobot /> },
  { name: "Settings", path: "/settings", icon: <FaCog /> },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white fixed border-r border-slate-800">

      <div className="p-6 text-center border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-400">Trishul CRM</h1>
        <p className="text-sm text-slate-400">
          Smart Business Management
        </p>
      </div>

      <nav className="mt-4 px-3">
        {menu.map((item) => (
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