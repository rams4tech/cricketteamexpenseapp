import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Teams() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    date_formed: new Date().toISOString().split('T')[0],
    manager_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchPlayers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('/api/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await axios.get(`/api/teams/${teamId}`);
      setSelectedTeam(response.data);
      setShowPlayerModal(true);
    } catch (error) {
      console.error('Error fetching team details:', error);
      alert('Error fetching team details');
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
        await axios.put(`/api/teams/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post('/api/teams', formData);
      }
      setFormData({ name: '', date_formed: new Date().toISOString().split('T')[0], manager_id: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Error saving team');
    }
  };

  const handleEdit = (team) => {
    setFormData({
      name: team.name,
      date_formed: team.date_formed,
      manager_id: team.manager_id
    });
    setEditingId(team.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await axios.delete(`/api/teams/${id}`);
        fetchTeams();
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team');
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({ name: '', date_formed: new Date().toISOString().split('T')[0], manager_id: '' });
    setEditingId(null);
  };

  const handlePlayerCheckbox = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleAddPlayers = async () => {
    if (!selectedTeam || selectedPlayers.length === 0) return;

    try {
      const promises = selectedPlayers.map(playerId =>
        axios.post(`/api/teams/${selectedTeam.id}/players/${playerId}`)
      );
      await Promise.all(promises);

      // Refresh team details
      fetchTeamDetails(selectedTeam.id);
      setSelectedPlayers([]);
      alert('Players added successfully!');
    } catch (error) {
      console.error('Error adding players:', error);
      alert(error.response?.data?.error || 'Error adding players');
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!selectedTeam) return;

    if (window.confirm('Remove this player from the team?')) {
      try {
        await axios.delete(`/api/teams/${selectedTeam.id}/players/${playerId}`);
        fetchTeamDetails(selectedTeam.id);
        fetchTeams();
      } catch (error) {
        console.error('Error removing player:', error);
        alert('Error removing player');
      }
    }
  };

  const closeModal = () => {
    setShowPlayerModal(false);
    setSelectedTeam(null);
    setSelectedPlayers([]);
    fetchTeams();
  };

  const availablePlayers = players.filter(player =>
    !selectedTeam?.players?.some(tp => tp.id === player.id)
  );

  return (
    <div>
      <h2 className="mb-4">Teams</h2>

      {isAdmin() && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Edit Team' : 'Add New Team'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Team Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date Formed</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date_formed"
                    value={formData.date_formed}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Team Manager</label>
                  <select
                    className="form-select"
                    name="manager_id"
                    value={formData.manager_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a manager...</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.firstname} {player.lastname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update Team' : 'Add Team'}
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
          <h5 className="mb-0">Teams List</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : teams.length === 0 ? (
            <p className="text-muted text-center">No teams added yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Date Formed</th>
                    <th>Manager</th>
                    <th>Players</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td>{team.name}</td>
                      <td>{new Date(team.date_formed).toLocaleDateString()}</td>
                      <td>{team.manager_name}</td>
                      <td>
                        <span className="badge bg-info">{team.player_count} player(s)</span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => fetchTeamDetails(team.id)}
                          >
                            View Players
                          </button>
                          {isAdmin() && (
                            <>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(team)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(team.id)}
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

      {/* Player Management Modal */}
      {showPlayerModal && selectedTeam && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedTeam.name} - Players</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6>Team Information</h6>
                  <p><strong>Date Formed:</strong> {new Date(selectedTeam.date_formed).toLocaleDateString()}</p>
                  <p><strong>Manager:</strong> {selectedTeam.manager_name}</p>
                </div>

                <h6 className="mb-3">Current Players ({selectedTeam.players?.length || 0})</h6>
                {selectedTeam.players?.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Joined Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeam.players.map((player) => (
                          <tr key={player.id}>
                            <td>{player.firstname} {player.lastname}</td>
                            <td>{player.mobilenumber}</td>
                            <td>{new Date(player.joined_date).toLocaleDateString()}</td>
                            <td>
                              {isAdmin() && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemovePlayer(player.id)}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No players in this team yet.</p>
                )}

                {isAdmin() && (
                  <>
                    <hr />

                    <h6 className="mb-3">Add Players to Team</h6>
                    {availablePlayers.length > 0 ? (
                      <>
                        <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {availablePlayers.map((player) => (
                            <div key={player.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`player-${player.id}`}
                                checked={selectedPlayers.includes(player.id)}
                                onChange={() => handlePlayerCheckbox(player.id)}
                              />
                              <label className="form-check-label" htmlFor={`player-${player.id}`}>
                                {player.firstname} {player.lastname} - {player.mobilenumber}
                              </label>
                            </div>
                          ))}
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={handleAddPlayers}
                          disabled={selectedPlayers.length === 0}
                        >
                          Add Selected Players ({selectedPlayers.length})
                        </button>
                      </>
                    ) : (
                      <p className="text-muted">All players are already in this team.</p>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
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

export default Teams;
