import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    teams: [],
    overallSummary: {
      totalContributions: 0,
      totalExpenses: 0,
      balance: 0,
      totalTeams: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      setError('Access denied. This page is only available to administrators.');
      setLoading(false);
      return;
    }
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h5>Error</h5>
          <p>{error}</p>
          {user?.role !== 'admin' && (
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              Go to Profile
            </button>
          )}
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={fetchDashboardData}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const { teams, overallSummary } = dashboardData;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <span className="badge bg-danger">Admin Only</span>
      </div>

      {/* Overall Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card summary-card bg-success text-white">
            <div className="card-body">
              <h6 className="text-uppercase">Total Contributions</h6>
              <h3>₹{overallSummary.totalContributions.toFixed(2)}</h3>
              <small>Across all your teams</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card summary-card bg-danger text-white">
            <div className="card-body">
              <h6 className="text-uppercase">Total Expenses</h6>
              <h3>₹{overallSummary.totalExpenses.toFixed(2)}</h3>
              <small>Including match expenses</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card summary-card bg-primary text-white">
            <div className="card-body">
              <h6 className="text-uppercase">Balance</h6>
              <h3 className={overallSummary.balance >= 0 ? '' : 'text-warning'}>
                ₹{overallSummary.balance.toFixed(2)}
              </h3>
              <small>{overallSummary.balance >= 0 ? 'Surplus' : 'Deficit'}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card summary-card bg-info text-white">
            <div className="card-body">
              <h6 className="text-uppercase">Teams Managed</h6>
              <h3>{overallSummary.totalTeams}</h3>
              <small>Teams under your management</small>
            </div>
          </div>
        </div>
      </div>

      {/* Team-wise Breakdown */}
      <div className="row mb-3">
        <div className="col-12">
          <h4 className="mb-3">Team-wise Financial Breakdown</h4>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="alert alert-info">
          <h5>No Teams Found</h5>
          <p>You are not currently managing any teams. Create or be assigned as a manager to view team financial data.</p>
          <button className="btn btn-primary" onClick={() => navigate('/teams')}>
            Go to Teams
          </button>
        </div>
      ) : (
        <div className="row">
          {teams.map((team) => (
            <div key={team.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0">{team.name}</h5>
                  <small className="text-muted">
                    {team.player_count} player{team.player_count !== 1 ? 's' : ''}
                  </small>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Contributions:</span>
                      <span className="text-success fw-bold">
                        ₹{team.totalContributions.toFixed(2)}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Expenses:</span>
                      <span className="text-danger fw-bold">
                        ₹{team.totalExpenses.toFixed(2)}
                      </span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">Balance:</span>
                      <span className={`fw-bold ${team.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                        ₹{team.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {team.balance < 0 && (
                    <div className="alert alert-warning py-2 px-3 small mb-0">
                      <strong>Deficit!</strong> This team needs ₹{Math.abs(team.balance).toFixed(2)} more in contributions.
                    </div>
                  )}

                  {team.balance >= 0 && (
                    <div className="alert alert-success py-2 px-3 small mb-0">
                      <strong>Surplus!</strong> Team has ₹{team.balance.toFixed(2)} remaining.
                    </div>
                  )}
                </div>
                <div className="card-footer bg-transparent">
                  <button
                    className="btn btn-sm btn-outline-primary w-100"
                    onClick={() => navigate('/teams')}
                  >
                    View Team Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
