import { useState } from "react";
import { FaBell } from "react-icons/fa";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "New Lead Added",
      time: "2 min ago",
    },
    {
      id: 2,
      title: "Customer Converted",
      time: "15 min ago",
    },
    {
      id: 3,
      title: "Task Completed",
      time: "1 hour ago",
    },
    {
      id: 4,
      title: "Report Exported",
      time: "Today",
    },
  ];

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="relative bg-slate-800 p-3 rounded-full hover:bg-slate-700 transition"
      >
        <FaBell className="text-white text-lg" />

        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {notifications.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 z-50">

          <div className="p-4 border-b border-slate-700">

            <h2 className="text-white font-bold">
              Notifications
            </h2>

          </div>

          {notifications.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 hover:bg-slate-800 border-b border-slate-800 cursor-pointer"
            >
              <p className="text-white">
                {item.title}
              </p>

              <p className="text-gray-400 text-sm">
                {item.time}
              </p>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}