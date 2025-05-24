import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUniversity, FaShieldAlt } from 'react-icons/fa';
import { MdError } from 'react-icons/md';
import { HiOutlineMail, HiOutlineKey } from 'react-icons/hi';
import { RiLockPasswordLine } from 'react-icons/ri';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import '../styles/Login.css'; // 🛑 ton CSS importé

function Login({ onLogin }) { // 👈 Ajout de onLogin ici
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    const response = await axios.post('http://localhost:3000/api/admin/login', { 
      email: email.toLowerCase().trim(), 
      pin: pin.toString()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data.token) {
      throw new Error('Token non reçu');
    }

    localStorage.setItem('token', response.data.token);
    
    // Configure axios pour envoyer le token par défaut
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    
    if (onLogin) onLogin();
    navigate('/dashboard');
  } catch (err) {
    console.error('Erreur de connexion:', err);
    setError(err.response?.data?.error || 'Identifiants incorrects ou accès non autorisé.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-header-content">
            <FaUniversity className="icon-large" />
            <h1>Banque Admin</h1>
            <p><FaShieldAlt className="icon-small" /> Portail sécurisé d'administration</p>
          </div>
        </div>

        <div className="login-body">
          <h2>Connexion</h2>
          <p>Accédez à votre tableau de bord administrateur</p>

          {error && (
            <div className="error-message">
              <MdError className="icon-small" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email professionnel</label>
              <div className="input-wrapper">
                <HiOutlineMail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@votrebanque.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Code PIN</label>
              <div className="input-wrapper">
                <HiOutlineKey className="input-icon" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  maxLength="6"
                  pattern="\d{6}"
                  required
                />
              </div>
              <small><RiLockPasswordLine className="icon-small" /> 6 chiffres requis</small>
            </div>

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? (
                <>
                  <AiOutlineLoading3Quarters className="spinner" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>
            © {new Date().getFullYear()} Banque Admin. Tous droits réservés. <br />
            <a href="#">Assistance technique</a>
          </p>
        </div>

        <div className="security-note">
          <FaShieldAlt className="icon-small" />
          Pour votre sécurité, déconnectez-vous après chaque session.
        </div>
      </div>
    </div>
  );
}

export default Login;
