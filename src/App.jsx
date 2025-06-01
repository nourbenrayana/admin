// App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MainLayout from './components/MainLayout';
import Dashboard from './pages/DashboardPage';
import Login from './pages/LoginPage';
import UserManagement from './pages/UserManagement';
import UserAccountsPage from './components/UserAccountsPage';
import CardRequestsManagement from './pages/CardRequestsManagement';
import ReclamationsPage from './pages/ReclamationsPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const cleanToken = (token) => token?.replace(/\s/g, '') || null;

  const verifyAuth = async () => {
    let token = cleanToken(localStorage.getItem('token'));
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/verify-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAuth();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <Router>
      {isAuthenticated ? (
        <MainLayout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/users/:userId/accounts" element={<UserAccountsPage />} />
            <Route path="/card-requests" element={<CardRequestsManagement />} />
            <Route path="/reclamations" element={<ReclamationsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </MainLayout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;