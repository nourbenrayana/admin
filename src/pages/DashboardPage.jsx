import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Brush
} from 'recharts';
import '../styles/Dashboard.css';
import MainLayout from '../components/MainLayout';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function Dashboard() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [transactionData, setTransactionData] = useState([]);
  const [accountTypeData, setAccountTypeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    const normalizeTypeName = (name) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('courant') || lowerName.includes('current')) return 'Courant';
      if (lowerName.includes('épargne') || lowerName.includes('epargne')) return 'Épargne';
      if (lowerName.includes('business')) return 'Business';
      if (lowerName.includes('checking')) return 'Checking';
      return name;
    };

    const groupedData = data.reduce((acc, item) => {
      const normalizedType = normalizeTypeName(item.name);
      const existing = acc.find(i => i.name === normalizedType);
      if (existing) {
        existing.value += item.value;
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
              <Tooltip formatter={(value) => [`${value}`, 'Comptes']} />
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
  <div className="dashboard-content">
    <div className="charts-grid">
      <MonthlySignupsChart data={monthlyData} />
      <ActivityLineChart data={activityData} />
      <TransactionsChart data={transactionData} />
      <AccountTypesChart data={accountTypeData} />
    </div>
  </div>
);

}

export default Dashboard;