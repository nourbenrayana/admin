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
  FaExclamationCircle // Nouvelle icône pour les réclamations
} from 'react-icons/fa';
import logo from '../assets/logo.jpg';
import '../styles/Sidebar.css';

const SidebarItem = ({ icon, text, active = false, expanded, onClick }) => {
  return (
    <button onClick={onClick} className={`sidebar-item ${active ? 'active' : ''}`}>
      <span className="icon">{icon}</span>
      {expanded && <span className="text-sm">{text}</span>}
    </button>
  );
};

const Sidebar = ({ sidebarOpen, toggleSidebar, activeTab, setActiveTab, setIsAuthenticated  }) => {
  const navigate = useNavigate();

  const handleNavigation = (tab) => {
    console.log('Navigating to:', tab);
    if (setActiveTab) {
      setActiveTab(tab);
    }
    // Navigation
    switch(tab) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'users':
        navigate('/user-management');
        break;
      case 'cardRequests':
        navigate('/card-requests');
        break;
      case 'reclamations': // Nouveau cas pour les réclamations
        navigate('/reclamations');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInitials');
    setIsAuthenticated(false);
    navigate('/login');
  };
  
  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-inner">
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="sidebar-title-container">
              <img src={logo} alt="Caixa Bank Logo" className="sidebar-logo" />
              <h1 className="sidebar-title">Caixa Bank</h1>
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
          {/* Nouvel élément pour les réclamations */}
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