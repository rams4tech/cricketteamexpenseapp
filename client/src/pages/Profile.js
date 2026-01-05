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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstname: '',
    lastname: '',
    birthday: '',
    mobilenumber: '',
    email: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    logger.info('Profile page loaded');
    logger.trackPageView('Profile', window.location.href);
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/profile');
      setProfileData(response.data);

      if (response.data.player) {
        setEditFormData({
          firstname: response.data.player.firstname || '',
          lastname: response.data.player.lastname || '',
          birthday: response.data.player.birthday || '',
          mobilenumber: response.data.player.mobilenumber || '',
          email: response.data.player.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load profile data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profileData.player) {
      setEditFormData({
        firstname: profileData.player.firstname || '',
        lastname: profileData.player.lastname || '',
        birthday: profileData.player.birthday || '',
        mobilenumber: profileData.player.mobilenumber || '',
        email: profileData.player.email || ''
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');

    try {
      const response = await axios.put(`/api/players/${profileData.player.id}`, editFormData);

      setProfileData(prev => ({
        ...prev,
        player: response.data
      }));

      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaveLoading(false);
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

  const { player, teams, accountSummary, recentMatches } = profileData || {};

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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Player Information</h5>
                {player && !isEditing && (
                  <button className="btn btn-sm btn-primary" onClick={handleEditClick}>
                    Edit Profile
                  </button>
                )}
              </div>
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

              {player && !isEditing && (
                <>
                  <div className="mb-3">
                    <strong>Name:</strong> {player.firstname} {player.lastname}
                  </div>
                  <div className="mb-3">
                    <strong>Birthday:</strong> {player.birthday || 'N/A'}
                  </div>
                  <div className="mb-3">
                    <strong>Mobile Number:</strong> {player.mobilenumber || 'N/A'}
                  </div>
                  <div className="mb-3">
                    <strong>Email:</strong> {player.email || 'N/A'}
                  </div>
                </>
              )}

              {player && isEditing && (
                <form onSubmit={handleSaveProfile}>
                  <div className="mb-3">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstname"
                      value={editFormData.firstname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastname"
                      value={editFormData.lastname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Birthday (MM-DD)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="birthday"
                      value={editFormData.birthday}
                      onChange={handleInputChange}
                      placeholder="MM-DD (e.g., 03-15)"
                      pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="mobilenumber"
                      value={editFormData.mobilenumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                      {saveLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={saveLoading}>
                      Cancel
                    </button>
                  </div>
                </form>
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

      {/* Recent Matches Section */}
      {player && recentMatches && recentMatches.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Recent Matches</h5>
                <hr />
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Team</th>
                        <th>Opponent</th>
                        <th>Venue</th>
                        <th>My Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMatches.map((match) => (
                        <tr key={match.id}>
                          <td>{new Date(match.match_date).toLocaleDateString()}</td>
                          <td>{match.team_name || 'N/A'}</td>
                          <td>{match.opponent_team || 'N/A'}</td>
                          <td>{match.venue || 'N/A'}</td>
                          <td>₹{match.expense_share?.toFixed(2) || '0.00'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="btn btn-sm btn-outline-primary mt-2"
                  onClick={() => navigate('/matches')}
                >
                  View All Matches
                </button>
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
