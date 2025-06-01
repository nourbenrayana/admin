import React from 'react';
import { FaSort, FaUsers } from 'react-icons/fa';
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
  setShowModal,
  onUserDeleted 
}) {
  if (!users || users.length === 0) {
    return <p className="message">Aucun utilisateur à afficher</p>;
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
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Encode l'ID pour gérer les slashes
        console.log("ID à supprimer:", userId);
        const encodedId = encodeURIComponent(userId);
        console.log("ID encodé:", encodedId);
        const response = await fetch(`http://localhost:3000/api/users/${encodeURIComponent(userId)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Erreur HTTP: ${response.status}`);
        }

        Swal.fire('Supprimé !', "L'utilisateur a été supprimé.", 'success');
        // Ajoutez une prop pour mettre à jour la liste des utilisateurs après suppression
        if (typeof onUserDeleted === 'function') {
          onUserDeleted(userId);
        }
        
      } catch (error) {
        console.error("Détails de l'erreur:", error);
        Swal.fire("Erreur", error.message || "Échec de la suppression", "error");
      }
    }
  });
};


  return (
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
                  <div className="user-info-cell">
                    {user.faceImage ? (
                      <img
                        src={`data:image/jpeg;base64,${user.faceImage}`}
                        alt="Avatar"
                        className="user-avatar"
                        onClick={() => handleViewFace(user.faceImage)}
                      />
                    ) : (
                      <div className="user-avatar no-photo" onClick={() => handleViewFace(null)}>
                        <span>No photo</span>
                      </div>
                    )}
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.birthDate}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-action delete" onClick={() => handleDeleteUser(user.id)}>Supprimer</button>
                    <button className="btn-action accounts" onClick={() => handleViewAccounts(user.id)}>Comptes</button>
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
  );
}

export default UserTable;
