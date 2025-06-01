// src/pages/CardRequestsManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import '../styles/CardRequestsTable.css';

const CardRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [currentAction, setCurrentAction] = useState(null);
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
    } catch {
      return 'Non disponible';
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/get_card_requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedRequests = response.data.map((request) => ({
        ...request,
        createdAt: formatDate(request.createdAt),
        updatedAt: formatDate(request.updatedAt),
        birthDate: formatDate(request.birthDate),
        statusDisplay:
          request.status === 'pending'
            ? 'En attente'
            : request.status === 'accepted'
            ? 'Acceptée'
            : 'Refusée',
      }));

      setRequests(formattedRequests);
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Erreur de chargement');
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchRequests();
  }, [navigate]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleRespondToRequest = async () => {
    if (!selectedRequest || !currentAction) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const status = currentAction === 'accept' ? 'accepted' : 'rejected';
      await axios.post(
        'http://localhost:3000/api/respond_card_request',
        {
          requestId: selectedRequest.id,
          status,
          adminNotes: notesInput,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRequests((prev) =>
        prev.map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                status,
                statusDisplay: status === 'accepted' ? 'Acceptée' : 'Refusée',
                adminNotes: notesInput,
                updatedAt: formatDate(new Date()),
              }
            : request
        )
      );

      setShowNotesModal(false);
      setSelectedRequest(null);
      setNotesInput('');
      setCurrentAction(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || "Erreur lors de la réponse à la demande");
    }
  };

  const openActionModal = (request, action) => {
    setSelectedRequest(request);
    setCurrentAction(action);
    setShowNotesModal(true);
    setNotesInput('');
  };

  const filteredRequests = requests.filter((request) =>
    `${request.firstName} ${request.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.cpf.includes(searchTerm) ||
    request.cardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.statusDisplay.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = sortedRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(sortedRequests.length / requestsPerPage);

  return (
    <>
      {/* Modal Notes (Accepter/Refuser) */}
      {showNotesModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmer l'action</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowNotesModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                {currentAction === 'accept' 
                  ? `Accepter la demande de ${selectedRequest.firstName} ${selectedRequest.lastName} ?` 
                  : `Refuser la demande de ${selectedRequest.firstName} ${selectedRequest.lastName} ?`}
              </p>
              <div className="detail-row">
                <label className="detail-label">Notes :</label>
                <textarea
                  className="notes-textarea"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ajoutez un commentaire..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowNotesModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleRespondToRequest}
              >
                {currentAction === 'accept' ? 'Confirmer l\'acceptation' : 'Confirmer le refus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails de la demande</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDetailsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Nom complet :</span>
                <span>{selectedRequest.firstName} {selectedRequest.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">CPF :</span>
                <span>{selectedRequest.cpf}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type de carte :</span>
                <span>{selectedRequest.cardType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date de demande :</span>
                <span>{selectedRequest.createdAt}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Statut :</span>
                <span className={`badge ${
                  selectedRequest.status === 'pending' ? 'badge-warning' :
                  selectedRequest.status === 'accepted' ? 'badge-success' : 'badge-danger'
                }`}>
                  {selectedRequest.statusDisplay}
                </span>
              </div>
              {selectedRequest.adminNotes && (
                <div className="detail-row">
                  <span className="detail-label">Notes :</span>
                  <span>{selectedRequest.adminNotes}</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-close" 
                onClick={() => setShowDetailsModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-header">
          <h2>Gestion des demandes de cartes</h2>
          <div className="table-controls">
            <div className="search-box">
              <input
                type="text"
                className="input-search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-500">{filteredRequests.length} demandes trouvées</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="card-requests-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('firstName')}>Nom</th>
                <th onClick={() => requestSort('cpf')}>CPF</th>
                <th onClick={() => requestSort('cardType')}>Type de carte</th>
                <th onClick={() => requestSort('createdAt')}>Date de demande</th>
                <th onClick={() => requestSort('status')}>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.firstName} {request.lastName}</td>
                  <td>{request.cpf}</td>
                  <td>{request.cardType}</td>
                  <td>{request.createdAt}</td>
                  <td>
                    <span className={`badge ${
                      request.status === 'pending' ? 'badge-warning' :
                      request.status === 'accepted' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {request.statusDisplay}
                    </span>
                  </td>
                  <td>
                    {request.status === 'pending' && (
                      <>
                        <button className="btn-accept" onClick={() => openActionModal(request, 'accept')}>Accepter</button>
                        <button className="btn-reject" onClick={() => openActionModal(request, 'reject')}>Refuser</button>
                      </>
                    )}
                    <button className="btn-details" onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailsModal(true);
                    }}>
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Précédent</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => setCurrentPage(number)}
                className={currentPage === number ? 'active' : ''}
              >
                {number}
              </button>
            ))}
            <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Suivant</button>
          </div>
        )}
        
      </div>
    </>
  );
};

export default CardRequestsManagement;