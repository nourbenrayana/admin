// src/pages/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserTable from '../components/UserTable';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = useNavigate();

const formatDate = (dateString) => {
  if (!dateString || dateString.trim() === '') {
    return 'Non disponible';
  }

  try {
    // Supprimer les guillemets si la date est une chaîne JSON
    let cleanDate = dateString;
    if (typeof dateString === 'string' && dateString.startsWith('"') && dateString.endsWith('"')) {
      cleanDate = dateString.slice(1, -1);
    }

    // Vérifier si la date est déjà au format ISO (avec 'T')
    if (cleanDate.includes('T')) {
      const date = new Date(cleanDate);
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }

    // Gérer le format "DD/MM/YYYY"
    if (cleanDate.includes('/')) {
      const [day, month, year] = cleanDate.split('/');
      // Note: Les mois en JS sont 0-indexés (0 = janvier)
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }

    // Si aucun format reconnu, retourner la date originale
    return cleanDate;
  } catch (e) {
    console.error('Erreur de formatage de date:', e);
    return dateString || 'Non disponible'; // Retourner la date originale si le formatage échoue
  }
};

const fetchUserFace = async (userId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(`http://localhost:5000/api/get_user_face?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data?.image_base64 ? response.data : null;
  } catch (err) {
    console.error('Error fetching face:', err.response?.data || err.message);
    return null;  
  }
};
const fetchUsers = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    navigate('/login');
    return;
  }

  try {
    const response = await axios.get('http://localhost:3000/api/admin/allUsers', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // D'abord récupérer les utilisateurs de base
    const basicUsers = response.data.map(user => ({
      id: user.id,
      name: user.name || 'Non spécifié',
      email: user.email || 'Non spécifié',
      birthDate: formatDate(user.birthDate),
      faceImage: null // Initialisé à null
    }));

    setUsers(basicUsers); // Afficher d'abord les données de base
    setLoading(false);

    // Ensuite récupérer les visages en arrière-plan
    const usersWithFaces = await Promise.all(basicUsers.map(async (user) => {
      const face = await fetchUserFace(user.id);
      return {
        ...user,
        faceImage: face?.image_base64 || null
      };
    }));

    setUsers(usersWithFaces); // Mettre à jour avec les visages
  } catch (err) {
    console.error('Error:', err);
    setError(err.response?.data?.message || 'Erreur de chargement');
    setLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} activeTab="users" />
      
      <div className="user-title">
        <UserTable
          users={users}
          currentPage={currentPage}
          usersPerPage={usersPerPage}
          setCurrentPage={setCurrentPage}
          totalPages={Math.ceil(users.length / usersPerPage)}
          sortConfig={sortConfig}
          requestSort={requestSort}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
    </div>
  );
};

export default UserManagement;