"use client";

import { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import api from "../api/api"; 

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  // Load existing notifications from database
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      const response = await api.get("/notifications/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(response.data);

      const unread = response.data.filter(
        (notification) => !notification.is_read
      ).length;

      setUnreadCount(unread);
    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error
      );
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchNotifications();

    // WebSocket connection
    const ws = new WebSocket(
      `ws://127.0.0.1:8000/notifications/ws?token=${token}`
    );

    ws.onopen = () => {
      console.log("Notification WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);

        console.log(
          "New notification received:",
          newNotification
        );

        setNotifications((previous) => [
          newNotification,
          ...previous,
        ]);

        setUnreadCount((previous) => previous + 1);
      } catch (error) {
        console.error(
          "Invalid WebSocket notification:",
          error
        );
      }
    };

    ws.onerror = (error) => {
      console.error(
        "Notification WebSocket error:",
        error
      );
    };

    ws.onclose = () => {
      console.log(
        "Notification WebSocket disconnected"
      );
    };

    return () => {
      ws.close();
    };
  }, [token]);

  // Mark one notification as read
  const markAsRead = async (notificationId) => {
    if (!token) return;

    try {
      await api.put(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    try {
      await api.put(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    }
  };

  // Convert timestamp into readable time
  const formatTime = (createdAt) => {
    if (!createdAt) return "";

    const date = new Date(createdAt);

    return date.toLocaleString();
  };

  return (
    <div className="relative">

      {/* Notification Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative bg-slate-800 p-3 rounded-full hover:bg-slate-700 transition"
      >
        <FaBell className="text-white text-lg" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-slate-900 rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden">

          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">

            <div>
              <h2 className="text-white font-bold">
                Notifications
              </h2>

              <p className="text-gray-400 text-xs mt-1">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Mark all read
              </button>
            )}

          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="text-gray-600 text-3xl mx-auto mb-3" />

                <p className="text-gray-400">
                  No notifications
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    !item.is_read &&
                    markAsRead(item.id)
                  }
                  className={`px-4 py-3 border-b border-slate-800 cursor-pointer transition ${
                    item.is_read
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">

                    {/* Unread indicator */}
                    <div className="pt-1">
                      {!item.is_read && (
                        <span className="block w-2 h-2 bg-blue-400 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1">

                      <p className="text-white font-medium">
                        {item.title}
                      </p>

                      {item.message && (
                        <p className="text-gray-400 text-sm mt-1">
                          {item.message}
                        </p>
                      )}

                      <p className="text-gray-500 text-xs mt-2">
                        {formatTime(item.created_at)}
                      </p>

                    </div>

                  </div>
                </div>
              ))
            )}

          </div>
        </div>
      )}

    </div>
  );
}