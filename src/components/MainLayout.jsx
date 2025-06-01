// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/MainLayout.css';
import logo from'../assets/logo.jpg';

const MainLayout = ({ children, activeTab }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Non disponible';
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (e) {
      return 'Non disponible';
    }
  };

useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  const handleNewCardRequest = (data) => {
    const newNotification = {
      id: Date.now(),
      message: `Nouvelle demande de ${data.firstName} ${data.lastName}`,
      data: data,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    toast.success(newNotification.message, {
      position: 'top-right',
      autoClose: 5000,
      onClick: () => {
        setSelectedRequest(data);
        setShowDetailsModal(true);
      }
    });
  };

  socket.on('connect', () => {
    console.log('Socket.io connected');
    toast.info('Connecté aux mises à jour en temps réel', {
      position: 'bottom-right',
      autoClose: 3000
    });
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
    toast.error('Problème de connexion en temps réel', {
      position: 'bottom-right'
    });
  });

  // Enregistre UNE seule fois le handler
  socket.on('new_card_request', handleNewCardRequest);

  return () => {
    socket.off('new_card_request', handleNewCardRequest); // très important pour éviter doublons
    socket.disconnect();
  };
}, [navigate]);


return (
  <>
    <Sidebar 
      sidebarOpen={sidebarOpen} 
      toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      activeTab={activeTab} 
    />
    
    <div className="app-container">
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="header">
          <div className="header-left">
            <img src={logo} alt="Caixa Bank Logo" className="header-logo" />
            <h1 className="header-title">Caixa Bank</h1>
          </div>
          <div className="header-right">
            <NotificationBell 
              notifications={notifications}
              setNotifications={setNotifications}
              setSelectedRequest={setSelectedRequest}
              setShowDetailsModal={setShowDetailsModal}
              formatDate={formatDate}
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  </>
);

};

export default MainLayout;