import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/UserAccountsPage.css';

const UserAccountsPage = () => {
  const { userId } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState({});
  const [paidInvoices, setPaidInvoices] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState({});
  const [expandedAccount, setExpandedAccount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const rawId = userId.replace(/^users\//, '');
        const response = await fetch(`http://localhost:3000/api/comptes/user/${rawId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Erreur lors du chargement des comptes.');
        const data = await response.json();
        setAccounts(Array.isArray(data) ? data : [data]);
      } catch (error) {
        console.error(error);
        alert('Erreur : ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [userId]);

  const fetchTransactionsAndInvoices = async (accountId) => {
    try {
      setLoadingTransactions(prev => ({ ...prev, [accountId]: true }));
      
      // Récupérer les transactions
      const rawId = accountId.replace(/^comptes\//, '');
      const transactionsResponse = await fetch(`http://localhost:3000/api/transactions/compte/${rawId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!transactionsResponse.ok) throw new Error('Erreur lors du chargement des transactions.');
      const transactionsData = await transactionsResponse.json();

      // Récupérer les factures payées pour l'utilisateur
      const invoicesResponse = await fetch(`http://localhost:3000/api/factures/utilisateur/${userId.replace(/^users\//, '')}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!invoicesResponse.ok) throw new Error('Erreur lors du chargement des factures payées.');
      const invoicesData = await invoicesResponse.json();

      setTransactions(prev => ({ ...prev, [accountId]: Array.isArray(transactionsData) ? transactionsData : [transactionsData] }));
      setPaidInvoices(prev => ({ ...prev, [accountId]: invoicesData }));
    } catch (error) {
      console.error(error);
      alert('Erreur : ' + error.message);
    } finally {
      setLoadingTransactions(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const toggleAccountExpansion = (accountId) => {
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
    } else {
      setExpandedAccount(accountId);
      if (!transactions[accountId]) {
        fetchTransactionsAndInvoices(accountId);
      }
    }
  };

  // Fonction pour formater les paiements de factures comme des transactions
  const formatPaidInvoicesAsTransactions = (invoices) => {
    if (!invoices || !Array.isArray(invoices)) return [];
    
    return invoices.map(invoice => ({
      date: invoice.datePaiement,
      montant: invoice.montant,
      type: 'Paiement de facture',
      destinataireNom: `Facture #${invoice.factureOriginaleId || invoice.numeroFacture || 'N/A'}`,
      statut: 'Payée',
      devise: 'EUR' // Vous pouvez adapter cela selon vos besoins
    }));
  };

  return (
    <div className="page-container">
      <div className="content-box">
        <div className="page-header">
          <h1>Comptes de l'utilisateur</h1>
          <button onClick={() => navigate(-1)} className="back-button">← Retour</button>
        </div>

        {loading ? (
          <p className="message">Chargement...</p>
        ) : accounts.length > 0 ? (
          <div className="accounts-container">
            <table className="accounts-table">
              <thead>
  <tr>
    <th>Numéro de Compte</th> {/* Changé de "ID Compte" */}
    <th>Type</th>
    <th>Solde</th>
    <th>Statut</th>
    <th>Actions</th>
  </tr>
</thead>
<tbody>
  {accounts.map(account => (
    <React.Fragment key={account.id}>
      <tr className="account-summary" onClick={() => toggleAccountExpansion(account.id)}>
        <td>{account.numeroCompte}</td> 
        <td>{account.typeCompte}</td>
        <td>{account.solde} {account.devise}</td>
        <td>
          <span className={`status-badge ${account.statutCompte === 'actif' ? 'status-actif' : 'status-inactif'}`}>
            {account.statutCompte}
          </span>
        </td>
        <td>
          <button 
            className="toggle-transactions"
            onClick={(e) => {
              e.stopPropagation();
              toggleAccountExpansion(account.id);
            }}
          >
            {expandedAccount === account.id ? 'Masquer' : 'Voir'} opérations
          </button>
        </td>
      </tr>
                    {expandedAccount === account.id && (
                      <tr className="transactions-row">
                        <td colSpan="5">
                          <div className="transactions-section">
                            {loadingTransactions[account.id] ? (
                              <p className="message">Chargement des opérations...</p>
                            ) : (transactions[account.id]?.length > 0 || paidInvoices[account.id]?.length > 0) ? (
                              <table className="transactions-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Montant</th>
                                    <th>Type</th>
                                    <th>Destinataire/Bénéficiaire</th>
                                    <th>Statut</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* Afficher les transactions normales */}
                                  {transactions[account.id]?.map((transaction, index) => (
                                    <tr key={`transaction-${index}`}>
                                      <td>{new Date(transaction.date).toLocaleString()}</td>
                                      <td>{transaction.montant} {transaction.devise}</td>
                                      <td>{transaction.typeTransaction || transaction.type || '–'}</td>
                                      <td>{transaction.destinataireNom || transaction.compteDestinataire}</td>
                                      <td>
                                        <span className={`status-badge ${
                                          transaction.statut === 'Effectué' || transaction.statut === 'Payée'
                                            ? 'status-actif'
                                            : 'status-inactif'
                                        }`}>
                                          {transaction.statut || 'Effectué'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}

                                  {/* Afficher les paiements de factures comme des transactions */}
                                  {formatPaidInvoicesAsTransactions(paidInvoices[account.id])?.map((invoice, index) => (
                                    <tr key={`invoice-${index}`}>
                                      <td>{new Date(invoice.date).toLocaleString()}</td>
                                      <td>{invoice.montant} {invoice.devise}</td>
                                      <td>{invoice.type}</td>
                                      <td>{invoice.destinataireNom}</td>
                                      <td>
                                        <span className={`status-badge status-actif`}>
                                          {invoice.statut}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="message">Aucune opération trouvée pour ce compte.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="message">Aucun compte trouvé.</p>
        )}
      </div>
    </div>
  );
};

export default UserAccountsPage;