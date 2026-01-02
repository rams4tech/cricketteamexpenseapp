import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import usePageTracking from '../hooks/usePageTracking';
import { getLogger } from '../services/logger';

const logger = getLogger();

function Contributions() {
  usePageTracking('Contributions');
  const { isAdmin } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [formData, setFormData] = useState({
    player_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributions();
    fetchPlayers();
  }, []);

  const fetchContributions = async () => {
    try {
      const response = await axios.get('/api/contributions');
      setContributions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contributions:', error);
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    logger.trackEvent('ContributionFormSubmit', {
      playerId: formData.player_id,
      amount: formData.amount
    });

    try {
      await axios.post('/api/contributions', formData);

      logger.trackEvent('ContributionCreated', {
        playerId: formData.player_id,
        amount: formData.amount
      });

      logger.info('Contribution created successfully', {
        playerId: formData.player_id,
        amount: formData.amount
      });

      setFormData({
        player_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      fetchContributions();
    } catch (error) {
      logger.error('Error creating contribution', error, {
        playerId: formData.player_id,
        amount: formData.amount
      });
      console.error('Error saving contribution:', error);
      alert('Error saving contribution');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contribution?')) {
      logger.trackEvent('ContributionDeleteAttempt', { contributionId: id });

      try {
        await axios.delete(`/api/contributions/${id}`);

        logger.trackEvent('ContributionDeleted', { contributionId: id });
        logger.info('Contribution deleted successfully', { contributionId: id });

        fetchContributions();
      } catch (error) {
        logger.error('Error deleting contribution', error, { contributionId: id });
        console.error('Error deleting contribution:', error);
        alert('Error deleting contribution');
      }
    }
  };

  return (
    <div>
      <h2 className="mb-4">Contributions</h2>

      {isAdmin() && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Add New Contribution</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Player</label>
                  <select
                    className="form-select"
                    name="player_id"
                    value={formData.player_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a player</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.firstname} {player.lastname}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Contribution</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Contributions List</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : contributions.length === 0 ? (
            <p className="text-muted text-center">No contributions added yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Player</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((contribution) => (
                    <tr key={contribution.id}>
                      <td>{new Date(contribution.date).toLocaleDateString()}</td>
                      <td>{contribution.firstname} {contribution.lastname}</td>
                      <td>₹{parseFloat(contribution.amount).toFixed(2)}</td>
                      <td>{contribution.description || '-'}</td>
                      <td>
                        {isAdmin() && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(contribution.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contributions;
