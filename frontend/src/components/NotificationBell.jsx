import React, { useState, useEffect, useRef } from "react";
import {
  FaBell,
  FaTicketAlt,
  FaExclamationTriangle,
  FaClock,
  FaEdit
} from "react-icons/fa";
import { organizerEvents } from "../data/mockData";
import "../styles/components.css";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [animate, setAnimate] = useState(false);

  const dropdownRef = useRef();
  const notificationSound = useRef(null);

  /* =========================
     INIT AUDIO
  ========================== */
  useEffect(() => {
    notificationSound.current = new Audio(
      "https://www.soundjay.com/buttons/sounds/button-3.mp3"
    );
  }, []);

  const playSound = () => {
    if (notificationSound.current) {
      notificationSound.current.play().catch(() => {});
    }
  };

  /* =========================
     SMART ALERTS
  ========================== */
  const generateSmartAlerts = () => {
    let alerts = [];

    organizerEvents.forEach((event) => {
      if (event.status === "Brouillon") {
        alerts.push({
          id: `draft-${event.id}`,
          type: "draft",
          text: `"${event.title}" is still in draft mode`,
          isRead: false
        });
      }

      if (event.ticketsSold >= event.capacity * 0.8) {
        alerts.push({
          id: `almostfull-${event.id}`,
          type: "almostFull",
          text: `"${event.title}" is almost sold out`,
          isRead: false
        });
      }

      const eventDate = new Date(event.date);
      const today = new Date();
      const diffDays = (eventDate - today) / (1000 * 60 * 60 * 24);

      if (diffDays > 0 && diffDays <= 3) {
        alerts.push({
          id: `soon-${event.id}`,
          type: "startingSoon",
          text: `"${event.title}" starts in ${Math.ceil(diffDays)} day(s)`,
          isRead: false
        });
      }
    });

    return alerts;
  };

  /* =========================
     LOAD INITIAL ALERTS
  ========================== */
  useEffect(() => {
    setNotifications(generateSmartAlerts());
  }, []);

  /* =========================
     BOOKING SIMULATION
  ========================== */
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => {
        // remove old booking notification
        const filtered = prev.filter((n) => n.type !== "booking");

        const newNotification = {
          id: Date.now(),
          type: "booking",
          text: "New ticket booking received",
          isRead: false
        };

        setAnimate(true);
        playSound();
        setTimeout(() => setAnimate(false), 1000);

        return [newNotification, ...filtered].slice(0, 10);
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* =========================
     UNREAD COUNT (CALCULATED)
  ========================== */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* =========================
     MARK ALL AS READ
  ========================== */
  const handleClick = () => {
    setIsOpen(!isOpen);

    if (!isOpen) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  };

  /* =========================
     CLOSE OUTSIDE
  ========================== */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================
     ICON RENDER
  ========================== */
  const renderIcon = (type) => {
    switch (type) {
      case "booking":
        return <FaTicketAlt className="notif-icon booking" />;
      case "almostFull":
        return <FaExclamationTriangle className="notif-icon warning" />;
      case "startingSoon":
        return <FaClock className="notif-icon time" />;
      case "draft":
        return <FaEdit className="notif-icon draft" />;
      default:
        return <FaBell className="notif-icon" />;
    }
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button
        className={`nav-icon-btn nav-alert-btn ${animate ? "ring" : ""}`}
        onClick={handleClick}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="alert-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <h4>Notifications</h4>

          {notifications.length === 0 ? (
            <p className="empty-msg">No new notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${
                  n.isRead ? "read" : "unread"
                }`}
              >
                {renderIcon(n.type)}
                <span>{n.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;