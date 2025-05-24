// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import avatar from '../assets/avatar.png';
import { FaBars, FaTimes } from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Brush
} from 'recharts';
import '../styles/Dashboard.css';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function Dashboard() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [accountTypeData, setAccountTypeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      try {
        const dashboardResponse = await axios.get('http://localhost:3000/api/admin/dashboardStats', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const bankResponse = await axios.get('http://localhost:3000/api/admin/bankStats', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMonthlyData(dashboardResponse.data.monthlySignups);
        setActivityData(dashboardResponse.data.activityData);
        setTransactionData(bankResponse.data.transactionData);
        setAccountTypeData(bankResponse.data.accountTypeStats);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur de chargement');
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const MonthlySignupsChart = ({ data }) => (
    <div className="chart-container">
      <h3>Inscriptions mensuelles</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="count" fill="#8884d8" barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const ActivityLineChart = ({ data }) => (
    <div className="chart-container">
      <h3>Activité des utilisateurs</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="active" stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey="new" stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const TransactionsChart = ({ data }) => (
    <div className="chart-container">
      <h3>Transactions récentes</h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value) => [`${value} €`, 'Montant']} 
            />
            <Legend verticalAlign="top" height={36} />
            <Line 
              type="monotone" 
              dataKey="amount" 
              stroke="#FF8042" 
              strokeWidth={2}
              dot={{ r: 3, stroke: '#FF8042', strokeWidth: 1, fill: '#fff' }}
              activeDot={{ r: 6 }}
              name="Montant" 
            />
            <Brush dataKey="date" height={30} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p>Aucune donnée de transaction disponible</p>
      )}
    </div>
  );

  const AccountTypesChart = ({ data }) => {
    // Fonction pour normaliser les noms de types de comptes
    const normalizeTypeName = (name) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('courant') || lowerName.includes('current')) return 'Courant';
      if (lowerName.includes('épargne') || lowerName.includes('epargne')) return 'Épargne';
      if (lowerName.includes('business')) return 'Business';
      if (lowerName.includes('checking')) return 'Checking';
      return name; // Retourne le nom original si aucun match
    };
  
    // Regrouper les données par type normalisé
    const groupedData = data.reduce((acc, item) => {
      const normalizedType = normalizeTypeName(item.name);
      const existingItem = acc.find(i => i.name === normalizedType);
      
      if (existingItem) {
        existingItem.value += item.value;
      } else {
        acc.push({ name: normalizedType, value: item.value });
      }
      
      return acc;
    }, []);
  
    return (
      <div className="chart-container">
        <h3>Répartition des types de comptes</h3>
        {groupedData && groupedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={groupedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {groupedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Pourcentage']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p>Aucune donnée disponible</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading-screen"><div className="spinner" /></div>;
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {mobileSidebarOpen && <div className="mobile-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />}
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab="dashboard"
      />
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <button onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} className="mobile-sidebar-button">
              {mobileSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <h1 className="header-title">Tableau de bord Administrateur</h1>
          </div>
          <div className="user-controls">
            <div className="user-profile">
              <img src={avatar} alt="Admin" />
              {sidebarOpen && <span className="user-name">Admin</span>}
            </div>
          </div>
        </header>
        <main className="content-area">
          <div className="content-inner">
            <div className="charts-grid">
              <MonthlySignupsChart data={monthlyData} />
              <ActivityLineChart data={activityData} />
              <TransactionsChart data={transactionData} />
              <AccountTypesChart data={accountTypeData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;