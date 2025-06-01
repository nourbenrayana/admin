// src/components/Sidebar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaTachometerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
  FaCreditCard,
  FaExclamationCircle
} from 'react-icons/fa';
import logo from '../assets/avatar.png';
import '../styles/Sidebar.css';

const SidebarItem = ({ icon, text, active = false, expanded, onClick }) => {
  return (
    <button onClick={onClick} className={`sidebar-item ${active ? 'active' : ''}`}>
      <span className="icon">{icon}</span>
      {expanded && <span className="text-sm">{text}</span>}
    </button>
  );
};

const Sidebar = ({ sidebarOpen, toggleSidebar, activeTab, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleNavigation = React.useCallback((tab) => {
    console.log('Navigating to:', tab);
    // Navigation seulement si nécessaire
    if (window.location.pathname !== getPathForTab(tab)) {
      navigate(getPathForTab(tab));
    }
  }, [navigate]);

  const getPathForTab = (tab) => {
    switch(tab) {
      case 'dashboard': return '/dashboard';
      case 'users': return '/user-management';
      case 'cardRequests': return '/card-requests';
      case 'reclamations': return '/reclamations';
      default: return '/dashboard';
    }
  };

  const handleLogout = React.useCallback(() => {
    console.log("Déconnexion lancée");
    // Nettoyage synchronisé avant la navigation
    localStorage.removeItem('token');
    localStorage.removeItem('userInitials');
    
    if (setIsAuthenticated) {
      setIsAuthenticated(false);
    }
    
    // Navigation directe sans dépendances
    window.location.href = '/login'; // Alternative plus fiable que navigate()
  }, [setIsAuthenticated]);

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-inner">
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="sidebar-title-container">
              <img src={logo} alt="Caixa Bank Logo" className="sidebar-logo" />
              <h1 className="sidebar-title">Admin Bank</h1>
            </div>
          )}
          <button onClick={toggleSidebar} className="sidebar-toggle" aria-label="Toggle sidebar">
            {sidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>
    
        <nav className="sidebar-nav">
          <SidebarItem
            icon={<FaTachometerAlt />}
            text="Dashboard"
            active={activeTab === 'dashboard'}
            expanded={sidebarOpen}
            onClick={() => handleNavigation('dashboard')}
          />
          <SidebarItem
            icon={<FaUsers />}
            text="Utilisateurs"
            active={activeTab === 'users'}
            expanded={sidebarOpen}
            onClick={() => handleNavigation('users')}
          />
          <SidebarItem
            icon={<FaCreditCard />}
            text="Demandes de cartes"
            active={activeTab === 'cardRequests'}
            expanded={sidebarOpen}
            onClick={() => handleNavigation('cardRequests')}
          />
          <SidebarItem
            icon={<FaExclamationCircle />}
            text="Réclamations"
            active={activeTab === 'reclamations'}
            expanded={sidebarOpen}
            onClick={() => handleNavigation('reclamations')}
          />
        </nav>
    
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout" aria-label="Déconnexion">
            <FaSignOutAlt />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;