import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getLogger } from '../services/logger';

const logger = getLogger();

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    logger.info('Profile page loaded');
    logger.trackPageView('Profile', window.location.href);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/profile');
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load profile data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <h5>Error Loading Profile</h5>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProfileData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { player, teams, accountSummary } = profileData || {};

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">My Profile</h2>
        </div>
      </div>

      {/* User Account Info */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Account Information</h5>
              <hr />
              <div className="mb-3">
                <strong>Username:</strong> {user?.username}
              </div>
              <div className="mb-3">
                <strong>Role:</strong>{' '}
                <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                  {user?.role}
                </span>
              </div>
              {player && (
                <>
                  <div className="mb-3">
                    <strong>Player Name:</strong> {player.firstname} {player.lastname}
                  </div>
                  <div className="mb-3">
                    <strong>Birthday:</strong>{' '}
                    {player.birthday || 'N/A'}
                  </div>
                  <div className="mb-3">
                    <strong>Contact:</strong> {player.contact || 'N/A'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Summary */}
        {player && accountSummary && (
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Financial Summary</h5>
                <hr />
                <div className="mb-3">
                  <strong>Total Contributions:</strong>{' '}
                  <span className="text-success">₹{accountSummary.totalContributions?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="mb-3">
                  <strong>Total Expenses:</strong>{' '}
                  <span className="text-danger">₹{accountSummary.totalExpenses?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="mb-3">
                  <strong>Balance:</strong>{' '}
                  <span className={accountSummary.balance >= 0 ? 'text-success' : 'text-danger'}>
                    ₹{accountSummary.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <button
                  className="btn btn-primary btn-sm mt-2"
                  onClick={() => navigate(`/players/${player.id}/account`)}
                >
                  View Full Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Teams Section */}
      {player && teams && teams.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">My Teams</h5>
                <hr />
                <div className="row">
                  {teams.map((team) => (
                    <div key={team.id} className="col-md-4 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-title">{team.name}</h6>
                          <p className="card-text text-muted small mb-2">
                            Joined: {new Date(team.joined_date).toLocaleDateString()}
                          </p>
                          {team.manager_name && (
                            <p className="card-text small mb-2">
                              <strong>Manager:</strong> {team.manager_name}
                            </p>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate('/teams')}
                          >
                            View Teams
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <hr />
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/players')}
                >
                  View Players
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/teams')}
                >
                  View Teams
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/matches')}
                >
                  View Matches
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/contributions')}
                >
                  View Contributions
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/expenses')}
                >
                  View Expenses
                </button>
                {user?.role === 'admin' && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => navigate('/dashboard')}
                  >
                    Admin Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Player Linked Message */}
      {!player && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-info">
              <h5>No Player Profile Linked</h5>
              <p>
                Your account is not linked to a player profile. You can still access all features,
                but you won't see personal statistics and team information.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/players')}
              >
                View All Players
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
