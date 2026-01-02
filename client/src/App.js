import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import Contributions from './pages/Contributions';
import Expenses from './pages/Expenses';
import PlayerAccount from './pages/PlayerAccount';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ErrorBoundary from './components/ErrorBoundary';
import loggingConfig from './config/logging.config';
import { initializeLogger, getLogger } from './services/logger';
import setupAxiosInterceptors from './services/axiosInterceptor';

// Initialize logger
initializeLogger(loggingConfig);
setupAxiosInterceptors();

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to={isAuthenticated ? '/profile' : '/login'}>
          Cricket Expenses Manager
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuthenticated && (
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Profile</Link>
              </li>
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
              )}
              <li className="nav-item">
                <Link className="nav-link" to="/players">Players</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/teams">Teams</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/matches">Matches</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/contributions">Contributions</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/expenses">Expenses</Link>
              </li>
            </ul>
          )}
          <ul className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="nav-link text-white">
                    {user?.username} ({user?.role})
                  </span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary name="App">
      <Router>
        <AuthProvider>
          <div className="App">
            <Navigation />

            <div className="container mt-4">
              <ErrorBoundary name="Routes">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/" element={<Navigate to="/profile" replace />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
                  <Route path="/players/:id/account" element={<ProtectedRoute><PlayerAccount /></ProtectedRoute>} />
                  <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
                  <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
                  <Route path="/contributions" element={<ProtectedRoute><Contributions /></ProtectedRoute>} />
                  <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                </Routes>
              </ErrorBoundary>
            </div>
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
