// src/components/NotificationBell.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationBell = ({ notifications, setNotifications, setSelectedRequest, setShowDetailsModal, formatDate }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="notification-container">
      <button 
        className="notification-bell"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        {notifications.length > 0 && (
          <span className="notification-badge">{notifications.length}</span>
        )}
      </button>
      
      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <button onClick={() => {
                setNotifications([]);
                localStorage.removeItem('notifications');
              }}>Effacer tout</button>
          </div>
          {notifications.length === 0 ? (
            <div className="notification-empty">Aucune notification</div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className="notification-item"
                onClick={() => {
                  setSelectedRequest(notif.data);
                  setShowDetailsModal(true);
                }}
              >
                <div className="notification-message">{notif.message}</div>
                <div className="notification-time">
                  {formatDate(notif.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;