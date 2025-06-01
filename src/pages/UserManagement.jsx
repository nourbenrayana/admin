import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserTable from '../components/UserTable';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString || dateString.trim() === '') return 'Non disponible';

    try {
      let cleanDate = dateString;
      if (typeof dateString === 'string' && dateString.startsWith('"') && dateString.endsWith('"')) {
        cleanDate = dateString.slice(1, -1);
      }

      if (cleanDate.includes('T')) {
        const date = new Date(cleanDate);
        return new Intl.DateTimeFormat('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date);
      }

      if (cleanDate.includes('/')) {
        const [day, month, year] = cleanDate.split('/');
        const date = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(date);
      }

      return cleanDate;
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return dateString || 'Non disponible';
    }
  };

  const fetchUserFace = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`http://localhost:5000/api/get_user_face?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });

      const basicUsers = response.data.map(user => ({
        id: user.id,
        name: user.name || 'Non spécifié',
        email: user.email || 'Non spécifié',
        birthDate: formatDate(user.birthDate),
        faceImage: null
      }));

      setUsers(basicUsers);
      setLoading(false);

      const usersWithFaces = await Promise.all(basicUsers.map(async (user) => {
        const face = await fetchUserFace(user.id);
        return {
          ...user,
          faceImage: face?.image_base64 || null
        };
      }));

      setUsers(usersWithFaces);
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
  const handleUserDeleted = async (deletedUserId) => {
  try {
    // Mettre à jour l'état local immédiatement pour un feedback visuel rapide
    setUsers(prevUsers => prevUsers.filter(user => user.id !== deletedUserId));
    
    // Optionnel: Recharger les données depuis le serveur pour s'assurer de la synchronisation
    // await fetchUsers();
  } catch (error) {
    console.error("Erreur lors de la mise à jour après suppression:", error);
    // Vous pourriez vouloir recharger les données ici en cas d'erreur
    await fetchUsers();
  }
};
  return (
  <div className="user-management-container">
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
      onUserDeleted={handleUserDeleted} 
    />
  </div>

  );
};

export default UserManagement;
