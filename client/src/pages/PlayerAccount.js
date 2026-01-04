import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getLogger } from '../services/logger';

const logger = getLogger();

function PlayerAccount() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    logger.info('PlayerAccount page loaded');
    logger.trackPageView('PlayerAccount', window.location.href);
  }, []);
  const [loading, setLoading] = useState(true);

  const fetchAccountData = React.useCallback(async () => {
    try {
      const response = await axios.get(`/api/players/${id}/account`);
      setAccountData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching account data:', error);
      setLoading(false);
      alert('Error loading player account data');
    }
  }, [id]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="alert alert-danger mt-4">
        <h4>Player Not Found</h4>
        <p>Unable to load player account information.</p>
        <button className="btn btn-primary" onClick={() => navigate('/players')}>
          Back to Players
        </button>
      </div>
    );
  }

  const { player, totalContributions, totalMatchExpenses, balance, contributions, matches } = accountData;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Player Account</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/players')}>
          Back to Players
        </button>
      </div>

      {/* Player Info Card */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            {player.firstname} {player.lastname}
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Mobile:</strong> {player.mobilenumber}</p>
              {player.email && <p><strong>Email:</strong> {player.email}</p>}
              {player.birthday && <p><strong>Birthday:</strong> {player.birthday}</p>}
            </div>
            <div className="col-md-6">
              <p><strong>Member Since:</strong> {new Date(player.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h6 className="card-title">Total Contributions</h6>
              <h3 className="mb-0">₹{parseFloat(totalContributions).toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-danger">
            <div className="card-body">
              <h6 className="card-title">Total Match Expenses</h6>
              <h3 className="mb-0">₹{parseFloat(totalMatchExpenses).toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`card text-white ${balance >= 0 ? 'bg-info' : 'bg-warning'}`}>
            <div className="card-body">
              <h6 className="card-title">Current Balance</h6>
              <h3 className="mb-0">₹{parseFloat(balance).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions History */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Contribution History</h5>
        </div>
        <div className="card-body">
          {contributions && contributions.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((contribution) => (
                    <tr key={contribution.id}>
                      <td>{new Date(contribution.date).toLocaleDateString()}</td>
                      <td className="text-success">+₹{parseFloat(contribution.amount).toFixed(2)}</td>
                      <td>{contribution.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center mb-0">No contributions yet.</p>
          )}
        </div>
      </div>

      {/* Match Expenses History */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Match Expenses History</h5>
        </div>
        <div className="card-body">
          {matches && matches.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Team</th>
                    <th>Opponent</th>
                    <th>Venue</th>
                    <th>Total Match Expense</th>
                    <th>Your Share</th>
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
                      <td className="text-danger">-₹{parseFloat(match.expense_share).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center mb-0">No match expenses yet.</p>
          )}
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Account Summary</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Total Contributions:</strong> <span className="text-success">₹{parseFloat(totalContributions).toFixed(2)}</span></p>
              <p><strong>Total Match Expenses:</strong> <span className="text-danger">₹{parseFloat(totalMatchExpenses).toFixed(2)}</span></p>
            </div>
            <div className="col-md-6">
              <p><strong>Number of Contributions:</strong> {contributions.length}</p>
              <p><strong>Matches Played:</strong> {matches.length}</p>
            </div>
          </div>
          <hr />
          <div className="text-center">
            <h4>
              <strong>Current Balance: </strong>
              <span className={balance >= 0 ? 'text-success' : 'text-danger'}>
                ₹{parseFloat(balance).toFixed(2)}
              </span>
            </h4>
            {balance < 0 && (
              <div className="alert alert-warning mt-3">
                <strong>Note:</strong> Negative balance indicates pending contributions needed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerAccount;
