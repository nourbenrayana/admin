// src/pages/ReclamationsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ReclamationsPage.css';
import MainLayout from '../components/MainLayout'; 

const ReclamationsPage = () => {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeMessage, setStatusChangeMessage] = useState('');
  const [reclamationToChange, setReclamationToChange] = useState(null);
  const [newStatusToApply, setNewStatusToApply] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const statusOptions = [
    { value: 'new', label: 'Nouveau' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'resolved', label: 'Résolu' },
    { value: 'rejected', label: 'Rejeté' },
    { value: 'closed', label: 'Clôturé' }
  ];

  useEffect(() => {
    const fetchReclamations = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/reclamations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setReclamations(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reclamations:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement des réclamations');
        setLoading(false);
        setReclamations([]);
      }
    };

    fetchReclamations();
  }, []);

  const confirmStatusChange = (reclamation, newStatus) => {
    setReclamationToChange(reclamation);
    setNewStatusToApply(newStatus);
    setShowConfirmationModal(true);
  };

  const filteredReclamations = reclamations.filter(reclamation => {
    const searchLower = searchTerm.toLowerCase();
    return (
      reclamation.message.toLowerCase().includes(searchLower) ||
      (reclamation.userName && reclamation.userName.toLowerCase().includes(searchLower)) ||
      (reclamation.type && reclamation.type.toLowerCase().includes(searchLower)) ||
      (reclamation.status && reclamation.status.toLowerCase().includes(searchLower))
    );
  });

  const applyStatusChange = async () => {
    if (!reclamationToChange || !newStatusToApply) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/reclamations/update', {
        id: reclamationToChange['@metadata']?.['@id'],
        status: newStatusToApply
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setReclamations(prev =>
        prev.map(r =>
          r['@metadata']?.['@id'] === reclamationToChange['@metadata']?.['@id']
            ? { ...r, status: newStatusToApply }
            : r
        )
      );

      const statusLabel = statusOptions.find(opt => opt.value === newStatusToApply)?.label || newStatusToApply;
      setStatusChangeMessage(`Statut changé à "${statusLabel}" avec succès.`);
    } catch (err) {
      console.error('Erreur mise à jour statut :', err);
      setStatusChangeMessage('Erreur lors de la mise à jour du statut.');
    } finally {
      setShowStatusChangeModal(true);
      setShowConfirmationModal(false);
      setReclamationToChange(null);
      setNewStatusToApply('');
      setTimeout(() => {
        setShowStatusChangeModal(false);
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const handleShowFullMessage = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMessage('');
  };

  if (loading) return <div className="loading">Chargement en cours...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
      <div className="reclamations-management-container">
        <div className="table-container">
          <div className="table-header">
            <h2>Liste des Réclamations</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Rechercher..."
                className="input-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredReclamations.length === 0 ? (
            <p>Aucune réclamation trouvée.</p>
          ) : (
            <table className="card-requests-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Utilisateur</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredReclamations.map((reclamation) => (
                  <tr key={reclamation['@metadata']?.['@id'] || reclamation.id || Math.random()}>
                    <td>{formatDate(reclamation.createdAt)}</td>
                    <td>{reclamation.userName}</td>
                    <td>{reclamation.type || 'General'}</td>
                    <td>
                      {reclamation.message.length > 50 ? (
                        <>
                          {reclamation.message.slice(0, 50)}
                          <span
                            className="show-more"
                            onClick={() => handleShowFullMessage(reclamation.message)}
                            style={{ color: '#2E86DE', cursor: 'pointer' }}
                          >
                            ... Voir plus
                          </span>
                        </>
                      ) : (
                        reclamation.message
                      )}
                    </td>
                    <td>
                      <select
                        value={reclamation.status || 'new'}
                        onChange={(e) => confirmStatusChange(reclamation, e.target.value)}
                        className={`status-select status-${reclamation.status || 'new'}`}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal pour le message complet */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Message complet</h3>
              <p>{selectedMessage}</p>
              <button onClick={closeModal} className="modal-close-button">Fermer</button>
            </div>
          </div>
        )}

        {/* Modal de confirmation de changement de statut */}
        {showConfirmationModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmationModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Confirmation</h3>
              <p>
                Voulez-vous vraiment changer le statut de cette réclamation en <strong>"{statusOptions.find(opt => opt.value === newStatusToApply)?.label}"</strong> ?
              </p>
              <div className="modal-buttons">
                <button onClick={applyStatusChange} className="modal-confirm-button">Confirmer</button>
                <button onClick={() => setShowConfirmationModal(false)} className="modal-cancel-button">Annuler</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal pour confirmation de mise à jour */}
        {showStatusChangeModal && (
          <div className="modal-overlay">
            <div
              className={`modal-content status-change-modal ${statusChangeMessage.includes('Erreur') ? 'error' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <p>{statusChangeMessage}</p>
            </div>
          </div>
        )}
      </div>
  );
};

export default ReclamationsPage;