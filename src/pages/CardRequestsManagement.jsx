// src/pages/CardRequestsManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/CardRequestsTable.css';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CardRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [currentAction, setCurrentAction] = useState(null); // 'accept' or 'reject'
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // Filter and sort logic
const filteredRequests = requests.filter(request => 
  `${request.firstName} ${request.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
  request.cpf.includes(searchTerm) ||
  request.cardType.toLowerCase().includes(searchTerm.toLowerCase()) ||
  request.statusDisplay.toLowerCase().includes(searchTerm.toLowerCase())
);

const sortedRequests = [...filteredRequests].sort((a, b) => {
  if (a[sortConfig.key] < b[sortConfig.key]) {
    return sortConfig.direction === 'ascending' ? -1 : 1;
  }
  if (a[sortConfig.key] > b[sortConfig.key]) {
    return sortConfig.direction === 'ascending' ? 1 : -1;
  }
  return 0;
});

const indexOfLastRequest = currentPage * requestsPerPage;
const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
const currentRequests = sortedRequests.slice(indexOfFirstRequest, indexOfLastRequest);
const totalPages = Math.ceil(sortedRequests.length / requestsPerPage);
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

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/get_card_requests', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const formattedRequests = response.data.map(request => ({
        ...request,
        createdAt: formatDate(request.createdAt),
        updatedAt: formatDate(request.updatedAt),
        birthDate: formatDate(request.birthDate),
        statusDisplay: request.status === 'pending' ? 'En attente' : 
                        request.status === 'accepted' ? 'Acceptée' : 'Refusée'
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

    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

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

    socket.on('new_card_request', (data) => {
      const newNotification = {
        id: Date.now(), // Identifiant unique
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
      
      fetchRequests(); // Rafraîchir la liste des demandes
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
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

    await axios.post('http://localhost:3000/api/respond_card_request', {
      requestId: selectedRequest.id,
      status,
      adminNotes: notesInput
    }, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    setRequests(requests.map(request => 
      request.id === selectedRequest.id 
        ? { 
            ...request, 
            status, 
            statusDisplay: status === 'accepted' ? 'Acceptée' : 'Refusée',
            adminNotes: notesInput,
            updatedAt: formatDate(new Date())
          } 
        : request
    ));

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

  return (
    <div className="card-requests-management-container">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} activeTab="cardRequests" />
      
      {/* Modale de détails */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Détails de la demande</h3>
              <button onClick={() => setShowDetailsModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Nom complet:</span>
                <span>{selectedRequest.firstName} {selectedRequest.lastName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">CPF:</span>
                <span>{selectedRequest.cpf}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span>{selectedRequest.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Téléphone:</span>
                <span>{selectedRequest.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Adresse:</span>
                <span>{selectedRequest.address}, {selectedRequest.city}, {selectedRequest.zipCode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type de carte:</span>
                <span>{selectedRequest.cardType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Raison:</span>
                <span>{selectedRequest.reasonForCard}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Notes:</span>
                <span>{selectedRequest.adminNotes || 'Aucune'}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDetailsModal(false)} className="btn-close">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de notes */}
      {showNotesModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentAction === 'accept' ? 'Accepter la demande' : 'Refuser la demande'}</h3>
              <button onClick={() => setShowNotesModal(false)} className="modal-close">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-4">
                {currentAction === 'accept' 
                  ? 'Notes administratives (optionnel):' 
                  : 'Veuillez indiquer la raison du refus (obligatoire):'}
              </p>
              <textarea
                className="notes-textarea"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={currentAction === 'accept' ? 'Notes optionnelles...' : 'Raison du refus...'}
                required={currentAction === 'reject'}
              />
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => {
                  if (currentAction === 'reject' && !notesInput.trim()) {
                    toast.error('Veuillez fournir une raison pour le refus', {
                      position: 'top-center',
                      autoClose: 4000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                    });
                    return;
                  }

                  handleRespondToRequest();
                }} 
                className="btn-confirm"
              >
                Confirmer
              </button>
              <button onClick={() => setShowNotesModal(false)} className="btn-cancel">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {/* Notification bell icon */}
        <div className="notification-container">
          <button 
            className="notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔 {notifications.length > 0 && (
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
              <span className="text-sm text-gray-500">
                {filteredRequests.length} demandes trouvées
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="card-requests-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('firstName')}>
                    Nom
                    {sortConfig.key === 'firstName' && (
                      <span className={`sort-icon ${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`}>
                        ▲▼
                      </span>
                    )}
                  </th>
                  <th onClick={() => requestSort('cpf')}>
                    CPF
                    {sortConfig.key === 'cpf' && (
                      <span className={`sort-icon ${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`}>
                        ▲▼
                      </span>
                    )}
                  </th>
                  <th onClick={() => requestSort('cardType')}>
                    Type de carte
                    {sortConfig.key === 'cardType' && (
                      <span className={`sort-icon ${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`}>
                        ▲▼
                      </span>
                    )}
                  </th>
                  <th onClick={() => requestSort('createdAt')}>
                    Date de demande
                    {sortConfig.key === 'createdAt' && (
                      <span className={`sort-icon ${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`}>
                        ▲▼
                      </span>
                    )}
                  </th>
                  <th onClick={() => requestSort('status')}>
                    Statut
                    {sortConfig.key === 'status' && (
                      <span className={`sort-icon ${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`}>
                        ▲▼
                      </span>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map(request => (
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
                          <button 
                            className="btn-accept"
                            onClick={() => openActionModal(request, 'accept')}
                          >
                            Accepter
                          </button>
                          <button 
                            className="btn-reject"
                            onClick={() => openActionModal(request, 'reject')}
                          >
                            Refuser
                          </button>
                        </>
                      )}
                      <button 
                        className="btn-details"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                      >
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
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={currentPage === number ? 'active' : ''}
                >
                  {number}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardRequestsManagement;