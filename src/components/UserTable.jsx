import React from 'react';
import { FaSort, FaEdit, FaTrash, FaUsers, FaListAlt, FaEye } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import '../styles/UserTable.css';

function UserTable({ 
  users, 
  currentPage, 
  usersPerPage, 
  setCurrentPage,
  totalPages,
  sortConfig = {},
  requestSort,
  searchTerm,
  setSearchTerm,
  setSelectedUserAccounts, 
  setShowModal             
}) {
  if (!users || users.length === 0) {
    return <p>Aucun utilisateur à afficher</p>;
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigate = useNavigate();
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const filteredTotalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleViewAccounts = (userId) => {
    const cleanId = userId.replace(/^users\//, '');
    navigate(`/users/${cleanId}/accounts`);
  };

  const handleEditUser = async (userId) => {
    const { value: username } = await Swal.fire({
      title: "Modifier l'utilisateur",
      input: 'text',
      inputLabel: "Nouveau nom d'utilisateur",
      inputPlaceholder: 'Entrez le nouveau nom',
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
    });

    if (username) {
      console.log(`Mise à jour de l'utilisateur ${userId} avec le nouveau nom : ${username}`);
    }
  };

  const handleViewFace = (faceImage) => {
    if (!faceImage) {
      Swal.fire('Aucun visage', "Aucun visage n'est associé à cet utilisateur.", 'info');
      return;
    }

    Swal.fire({
      title: 'Visage associé',
      html: `<img src="data:image/jpeg;base64,${faceImage}" style="max-width: 100%;" alt="Visage de l'utilisateur">`,
      showCloseButton: true,
      showConfirmButton: false
    });
  };

  const handleDeleteUser = (userId) => {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Cette action est irréversible !",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("Suppression de l'utilisateur avec l'ID:", userId);
        Swal.fire('Supprimé !', "L'utilisateur a été supprimé avec succès.", 'success');
      }
    });
  };

  return (
    <div className="main-content">
      <div className="table-container">
        <div className="table-header">
          <h2><FaUsers style={{ marginRight: '8px' }} /> Gestion des utilisateurs</h2>
          <div className="table-controls">
            <div className="search-box">
              <button className="btn-search">
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <input
                type="text"
                className="input-search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-500">
              {filteredUsers.length} utilisateurs trouvés
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="user-table">
            <thead>
              <tr>
                {['name', 'email', 'birthDate'].map((key) => (
                  <th key={key} onClick={() => requestSort(key)}>
                    {key === 'name' ? 'Nom' : key === 'email' ? 'Email' : 'Date de naissance'}
                    {sortConfig.key === key && (
                      <span className={`sort-icon ${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`}>
                        <FaSort />
                      </span>
                    )}
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {user.faceImage ? (
                        <img 
                          src={`data:image/jpeg;base64,${user.faceImage}`} 
                          alt="Avatar" 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            cursor: 'pointer',
                            objectFit: 'cover'
                          }}
                          onClick={() => handleViewFace(user.faceImage)}
                        />
                      ) : (
                        <div 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            backgroundColor: '#ccc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleViewFace(user.faceImage)}
                        >
                          <span style={{ color: '#666', fontSize: '12px' }}>No photo</span>
                        </div>
                      )}
                      {user.name}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.birthDate}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-action edit" 
                        onClick={() => handleEditUser(user.id)}
                      >
                        Modifier
                      </button>
                      <button 
                        className="btn-action delete" 
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Supprimer
                      </button>
                      <button 
                        className="btn-action accounts" 
                        onClick={() => handleViewAccounts(user.id)}
                      >
                        Comptes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTotalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
              disabled={currentPage === 1}
              className={currentPage === 1 ? 'disabled' : ''}
            >
              Précédent
            </button>
            {Array.from({ length: filteredTotalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={currentPage === number ? 'active' : ''}
              >
                {number}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, filteredTotalPages))} 
              disabled={currentPage === filteredTotalPages}
              className={currentPage === filteredTotalPages ? 'disabled' : ''}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserTable;