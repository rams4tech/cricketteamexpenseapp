import React, { useState, useEffect } from 'react';
import { getLogger } from '../services/logger';

const logger = getLogger();
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Matches() {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    logger.info('Matches page loaded');
    logger.trackPageView('Matches', window.location.href);
  }, []);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState({
    team_id: '',
    match_date: new Date().toISOString().split('T')[0],
    opponent_team: '',
    venue: '',
    ground_fee: '',
    ball_amount: '',
    other_expenses: ''
  });
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [nonPayingPlayers, setNonPayingPlayers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerData, setNewPlayerData] = useState({
    firstname: '',
    lastname: '',
    mobilenumber: '',
    email: '',
    birthday: ''
  });

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    fetchPlayers();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/matches');
      setMatches(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
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

  const fetchMatchDetails = async (matchId) => {
    try {
      const response = await axios.get(`/api/matches/${matchId}`);
      setSelectedMatch(response.data);
      setShowPlayersModal(true);
    } catch (error) {
      console.error('Error fetching match details:', error);
      alert('Error fetching match details');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlayerCheckbox = (playerId) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        // When unchecking a player, also remove from non-paying list
        setNonPayingPlayers(nonPaying => nonPaying.filter(id => id !== playerId));
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleNonPayingCheckbox = (playerId) => {
    setNonPayingPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const calculateTotalExpense = () => {
    const ground = parseFloat(formData.ground_fee) || 0;
    const ball = parseFloat(formData.ball_amount) || 0;
    const other = parseFloat(formData.other_expenses) || 0;
    return ground + ball + other;
  };

  const calculateExpensePerPlayer = () => {
    const total = calculateTotalExpense();
    const payingPlayers = selectedPlayers.filter(id => !nonPayingPlayers.includes(id));
    return payingPlayers.length > 0 ? (total / payingPlayers.length).toFixed(2) : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedPlayers.length === 0) {
      alert('Please select at least one player for the match');
      return;
    }

    const payingPlayers = selectedPlayers.filter(id => !nonPayingPlayers.includes(id));
    if (payingPlayers.length === 0) {
      alert('At least one player must be a paying player');
      return;
    }

    try {
      const matchData = {
        ...formData,
        player_ids: selectedPlayers,
        non_paying_players: nonPayingPlayers
      };

      if (editingId) {
        await axios.put(`/api/matches/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post('/api/matches', matchData);
      }

      setFormData({
        team_id: '',
        match_date: new Date().toISOString().split('T')[0],
        opponent_team: '',
        venue: '',
        ground_fee: '',
        ball_amount: '',
        other_expenses: ''
      });
      setSelectedPlayers([]);
      setNonPayingPlayers([]);
      fetchMatches();
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Error saving match');
    }
  };

  const handleEdit = (match) => {
    setFormData({
      team_id: match.team_id,
      match_date: match.match_date,
      opponent_team: match.opponent_team || '',
      venue: match.venue || '',
      ground_fee: match.ground_fee,
      ball_amount: match.ball_amount,
      other_expenses: match.other_expenses
    });
    setEditingId(match.id);
    // Note: For edit, we don't pre-select players as they're managed in the modal
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this match? This will remove all player expense allocations.')) {
      try {
        await axios.delete(`/api/matches/${id}`);
        fetchMatches();
      } catch (error) {
        console.error('Error deleting match:', error);
        alert('Error deleting match');
      }
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      team_id: '',
      match_date: new Date().toISOString().split('T')[0],
      opponent_team: '',
      venue: '',
      ground_fee: '',
      ball_amount: '',
      other_expenses: ''
    });
    setSelectedPlayers([]);
    setEditingId(null);
  };

  const handleTogglePayingStatus = async (playerId, currentIsPaying) => {
    if (!selectedMatch) return;

    const newStatus = currentIsPaying === 0 ? 1 : 0;
    const action = newStatus === 1 ? 'paying' : 'non-paying';

    if (window.confirm(`Mark this player as ${action}? This will recalculate expenses for all paying players.`)) {
      try {
        await axios.put(`/api/matches/${selectedMatch.id}/players/${playerId}/paying-status`, {
          is_paying: newStatus
        });
        fetchMatchDetails(selectedMatch.id);
        fetchMatches();
      } catch (error) {
        console.error('Error updating paying status:', error);
        alert(error.response?.data?.error || 'Error updating paying status');
      }
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (!selectedMatch) return;

    if (window.confirm('Remove this player from the match? This will recalculate expenses for all players.')) {
      try {
        await axios.delete(`/api/matches/${selectedMatch.id}/players/${playerId}`);
        fetchMatchDetails(selectedMatch.id);
        fetchMatches();
      } catch (error) {
        console.error('Error removing player:', error);
        alert('Error removing player');
      }
    }
  };

  const handleAddPlayersToMatch = async () => {
    if (!selectedMatch || selectedPlayers.length === 0) return;

    try {
      const promises = selectedPlayers.map(playerId =>
        axios.post(`/api/matches/${selectedMatch.id}/players/${playerId}`)
      );
      await Promise.all(promises);
      fetchMatchDetails(selectedMatch.id);
      setSelectedPlayers([]);
      fetchMatches();
      alert('Players added successfully!');
    } catch (error) {
      console.error('Error adding players:', error);
      alert(error.response?.data?.error || 'Error adding players');
    }
  };

  const closeModal = () => {
    setShowPlayersModal(false);
    setSelectedMatch(null);
    setSelectedPlayers([]);
    fetchMatches();
  };

  const handleNewPlayerInputChange = (e) => {
    setNewPlayerData({
      ...newPlayerData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddNewPlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/players', newPlayerData);
      const newPlayer = response.data;

      // Refresh players list
      await fetchPlayers();

      // Automatically select the newly added player
      setSelectedPlayers(prev => [...prev, newPlayer.id]);

      // Reset form and close modal
      setNewPlayerData({
        firstname: '',
        lastname: '',
        mobilenumber: '',
        email: '',
        birthday: ''
      });
      setShowAddPlayerModal(false);

      alert(`Player ${newPlayer.firstname} ${newPlayer.lastname} added successfully!`);
    } catch (error) {
      console.error('Error adding new player:', error);
      alert('Error adding new player');
    }
  };

  const availablePlayers = players.filter(player =>
    !selectedMatch?.players?.some(mp => mp.id === player.id)
  );

  return (
    <div>
      <h2 className="mb-4">Match Management</h2>

      {isAdmin() && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingId ? 'Edit Match' : 'Add New Match'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Team</label>
                <select
                  className="form-select"
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a team...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Match Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="match_date"
                  value={formData.match_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Opponent Team (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  name="opponent_team"
                  value={formData.opponent_team}
                  onChange={handleInputChange}
                  placeholder="e.g., Victory Strikers"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Venue (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="e.g., City Stadium"
                />
              </div>
            </div>

            <h6 className="mt-3 mb-3">Match Expenses</h6>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Ground Fee</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="ground_fee"
                  value={formData.ground_fee}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Ball Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="ball_amount"
                  value={formData.ball_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Other Expenses</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="other_expenses"
                  value={formData.other_expenses}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>

            {!editingId && (
              <>
                <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
                  <h6 className="mb-0">Select Players</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => setShowAddPlayerModal(true)}
                  >
                    + Add New Player
                  </button>
                </div>
                <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}>
                  {players.length > 0 ? (
                    players.map((player) => (
                      <div key={player.id} className="d-flex align-items-center mb-2" style={{ paddingLeft: '5px' }}>
                        <div className="form-check" style={{ flex: 1 }}>
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
                        {selectedPlayers.includes(player.id) && (
                          <div className="form-check form-check-inline ms-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`non-paying-${player.id}`}
                              checked={nonPayingPlayers.includes(player.id)}
                              onChange={() => handleNonPayingCheckbox(player.id)}
                            />
                            <label className="form-check-label text-muted small" htmlFor={`non-paying-${player.id}`}>
                              Non-paying
                            </label>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted mb-0">No players available. Click "Add New Player" to add one.</p>
                  )}
                </div>

                {selectedPlayers.length > 0 && (
                  <div className="alert alert-info">
                    <strong>Expense Summary:</strong><br />
                    Total Expense: ₹{calculateTotalExpense().toFixed(2)}<br />
                    Players Selected: {selectedPlayers.length} ({selectedPlayers.length - nonPayingPlayers.length} paying{nonPayingPlayers.length > 0 ? `, ${nonPayingPlayers.length} non-paying` : ''})<br />
                    <strong>Expense per Paying Player: ₹{calculateExpensePerPlayer()}</strong>
                  </div>
                )}
              </>
            )}

            <div className="btn-group">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Match' : 'Create Match'}
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
          <h5 className="mb-0">Matches List</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : matches.length === 0 ? (
            <p className="text-muted text-center">No matches added yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Team</th>
                    <th>Opponent</th>
                    <th>Venue</th>
                    <th>Total Expense</th>
                    <th>Players</th>
                    <th>Per Player</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => (
                    <tr key={match.id}>
                      <td>{new Date(match.match_date).toLocaleDateString()}</td>
                      <td>{match.team_name || '-'}</td>
                      <td>{match.opponent_team || '-'}</td>
                      <td>{match.venue || '-'}</td>
                      <td>₹{parseFloat(match.total_expense).toFixed(2)}</td>
                      <td>
                        <span className="badge bg-info">{match.players_count} player(s)</span>
                      </td>
                      <td>₹{parseFloat(match.expense_per_player).toFixed(2)}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => fetchMatchDetails(match.id)}
                          >
                            View Details
                          </button>
                          {isAdmin() && (
                            <>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEdit(match)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(match.id)}
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

      {/* Match Details Modal */}
      {showPlayersModal && selectedMatch && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Match Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <h6>Match Information</h6>
                  <p><strong>Date:</strong> {new Date(selectedMatch.match_date).toLocaleDateString()}</p>
                  <p><strong>Team:</strong> {selectedMatch.team_name}</p>
                  {selectedMatch.opponent_team && <p><strong>Opponent:</strong> {selectedMatch.opponent_team}</p>}
                  {selectedMatch.venue && <p><strong>Venue:</strong> {selectedMatch.venue}</p>}
                  <hr />
                  <h6>Expenses Breakdown</h6>
                  <p><strong>Ground Fee:</strong> ₹{parseFloat(selectedMatch.ground_fee).toFixed(2)}</p>
                  <p><strong>Ball Amount:</strong> ₹{parseFloat(selectedMatch.ball_amount).toFixed(2)}</p>
                  <p><strong>Other Expenses:</strong> ₹{parseFloat(selectedMatch.other_expenses).toFixed(2)}</p>
                  <p><strong>Total Expense:</strong> ₹{parseFloat(selectedMatch.total_expense).toFixed(2)}</p>
                  <p><strong>Expense Per Player:</strong> ₹{parseFloat(selectedMatch.expense_per_player).toFixed(2)}</p>
                </div>

                <h6 className="mb-3">Players in Match ({selectedMatch.players?.length || 0})</h6>
                {selectedMatch.players?.length > 0 ? (
                  <div className="table-responsive mb-4">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Mobile</th>
                          <th>Status</th>
                          <th>Expense Share</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMatch.players.map((player) => (
                          <tr key={player.id}>
                            <td>{player.firstname} {player.lastname}</td>
                            <td>{player.mobilenumber}</td>
                            <td>
                              {player.is_paying === 0 ? (
                                <span className="badge bg-warning text-dark">Non-paying</span>
                              ) : (
                                <span className="badge bg-success">Paying</span>
                              )}
                            </td>
                            <td>₹{parseFloat(player.expense_share).toFixed(2)}</td>
                            <td>
                              {isAdmin() && (
                                <div className="btn-group">
                                  <button
                                    className="btn btn-sm btn-warning"
                                    onClick={() => handleTogglePayingStatus(player.id, player.is_paying)}
                                    title={player.is_paying === 0 ? "Mark as paying" : "Mark as non-paying"}
                                  >
                                    {player.is_paying === 0 ? 'Mark Paying' : 'Mark Non-paying'}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleRemovePlayer(player.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted">No players in this match yet.</p>
                )}

                {isAdmin() && (
                  <>
                    <hr />

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Add More Players</h6>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => setShowAddPlayerModal(true)}
                      >
                        + Add New Player
                      </button>
                    </div>
                    {availablePlayers.length > 0 ? (
                      <>
                        <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {availablePlayers.map((player) => (
                            <div key={player.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`modal-player-${player.id}`}
                                checked={selectedPlayers.includes(player.id)}
                                onChange={() => handlePlayerCheckbox(player.id)}
                              />
                              <label className="form-check-label" htmlFor={`modal-player-${player.id}`}>
                                {player.firstname} {player.lastname} - {player.mobilenumber}
                              </label>
                            </div>
                          ))}
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={handleAddPlayersToMatch}
                          disabled={selectedPlayers.length === 0}
                        >
                          Add Selected Players ({selectedPlayers.length})
                        </button>
                      </>
                    ) : (
                      <p className="text-muted">All players are already in this match. Click "Add New Player" to add a new one.</p>
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

      {/* Add New Player Modal */}
      {showAddPlayerModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Player</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddPlayerModal(false);
                    setNewPlayerData({
                      firstname: '',
                      lastname: '',
                      mobilenumber: '',
                      email: '',
                      birthday: ''
                    });
                  }}
                ></button>
              </div>
              <form onSubmit={handleAddNewPlayer}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstname"
                      value={newPlayerData.firstname}
                      onChange={handleNewPlayerInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastname"
                      value={newPlayerData.lastname}
                      onChange={handleNewPlayerInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mobile Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="mobilenumber"
                      value={newPlayerData.mobilenumber}
                      onChange={handleNewPlayerInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email (Optional)</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={newPlayerData.email}
                      onChange={handleNewPlayerInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Birthday (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="birthday"
                      value={newPlayerData.birthday}
                      onChange={handleNewPlayerInputChange}
                      placeholder="MM-DD (e.g., 01-15)"
                      pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                      title="Please enter date in MM-DD format (e.g., 01-15)"
                    />
                    <small className="form-text text-muted">Enter month and day (MM-DD)</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddPlayerModal(false);
                      setNewPlayerData({
                        firstname: '',
                        lastname: '',
                        mobilenumber: '',
                        email: '',
                        birthday: ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add Player
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Matches;
