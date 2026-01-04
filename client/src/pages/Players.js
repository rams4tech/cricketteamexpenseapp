import React, { useState, useEffect } from 'react';
import { getLogger } from '../services/logger';

const logger = getLogger();
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Players() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    logger.info('Players page loaded');
    logger.trackPageView('Players', window.location.href);
  }, []);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    mobilenumber: '',
    email: '',
    birthday: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerTeams, setPlayerTeams] = useState([]);
  const [showTeamsModal, setShowTeamsModal] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('/api/players');
      setPlayers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/players/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post('/api/players', formData);
      }
      setFormData({ firstname: '', lastname: '', mobilenumber: '', email: '', birthday: '' });
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Error saving player');
    }
  };

  const handleEdit = (player) => {
    setFormData({
      firstname: player.firstname,
      lastname: player.lastname,
      mobilenumber: player.mobilenumber,
      email: player.email || '',
      birthday: player.birthday || ''
    });
    setEditingId(player.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await axios.delete(`/api/players/${id}`);
        fetchPlayers();
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player');
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({ firstname: '', lastname: '', mobilenumber: '', email: '', birthday: '' });
    setEditingId(null);
  };

  const handleViewTeams = async (player) => {
    try {
      const response = await axios.get(`/api/players/${player.id}/teams`);
      setSelectedPlayer(player);
      setPlayerTeams(response.data);
      setShowTeamsModal(true);
    } catch (error) {
      console.error('Error fetching player teams:', error);
      alert('Error fetching player teams');
    }
  };

  const closeTeamsModal = () => {
    setShowTeamsModal(false);
    setSelectedPlayer(null);
    setPlayerTeams([]);
  };

  return (
    <div>
      <h2 className="mb-4">Players</h2>

      {isAdmin() && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Edit Player' : 'Add New Player'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Mobile Number</label>
                <input
                  type="tel"
                  className="form-control"
                  name="mobilenumber"
                  value={formData.mobilenumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Email (Optional)</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Birthday (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  placeholder="MM-DD (e.g., 03-15)"
                  pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                  title="Please enter date in MM-DD format (e.g., 03-15)"
                />
                <small className="form-text text-muted">Enter month and day (MM-DD format)</small>
              </div>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Player' : 'Add Player'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Players List</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : players.length === 0 ? (
            <p className="text-muted text-center">No players added yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Mobile Number</th>
                    <th>Email</th>
                    <th>Birthday</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td>{player.firstname}</td>
                      <td>{player.lastname}</td>
                      <td>{player.mobilenumber}</td>
                      <td>{player.email || '-'}</td>
                      <td>{player.birthday || '-'}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => navigate(`/players/${player.id}/account`)}
                            title="View Account Balance"
                          >
                            Account
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleViewTeams(player)}
                          >
                            Teams
                          </button>
                          {isAdmin() && (
                            <>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(player)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(player.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Teams Modal */}
      {showTeamsModal && selectedPlayer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedPlayer.firstname} {selectedPlayer.lastname} - Teams
                </h5>
                <button type="button" className="btn-close" onClick={closeTeamsModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6>Player Information</h6>
                  <p><strong>Mobile:</strong> {selectedPlayer.mobilenumber}</p>
                  {selectedPlayer.email && <p><strong>Email:</strong> {selectedPlayer.email}</p>}
                  {selectedPlayer.birthday && <p><strong>Birthday:</strong> {selectedPlayer.birthday}</p>}
                </div>

                <h6 className="mb-3">Teams ({playerTeams.length})</h6>
                {playerTeams.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Team Name</th>
                          <th>Manager</th>
                          <th>Date Formed</th>
                          <th>Joined Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerTeams.map((team) => (
                          <tr key={team.id}>
                            <td>{team.name}</td>
                            <td>{team.manager_name}</td>
                            <td>{new Date(team.date_formed).toLocaleDateString()}</td>
                            <td>{new Date(team.joined_date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">This player is not part of any team yet.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeTeamsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Players;
