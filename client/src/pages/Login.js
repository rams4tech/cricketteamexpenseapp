import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getLogger } from '../services/logger';

const logger = getLogger();

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    logger.info('Login page loaded');
    logger.trackPageView('Login', window.location.href);
  }, []);
  const [resetFormData, setResetFormData] = useState({
    username: '',
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const securityQuestions = [
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was the name of your elementary school?",
    "What is your favorite sports team?",
    "What was your childhood nickname?",
    "In what city did you meet your spouse/partner?",
    "What is your favorite movie?"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    logger.info('Login attempt started', { username: formData.username });
    logger.trackEvent('LoginAttempt', { username: formData.username });

    try {
      const response = await axios.post('/api/auth/login', formData);
      const { token, user } = response.data;

      logger.info('Login successful', { username: formData.username, role: user.role });
      logger.trackEvent('LoginSuccess', { username: formData.username, role: user.role });

      // Set user context in logger
      logger.setUser(user.username, user.id);

      // Use AuthContext login function
      login(user, token);

      // Redirect to profile page
      navigate('/profile');
    } catch (error) {
      logger.error('Login failed', error, {
        username: formData.username,
        errorMessage: error.response?.data?.error,
        statusCode: error.response?.status
      });
      logger.trackEvent('LoginFailure', {
        username: formData.username,
        error: error.response?.data?.error || error.message
      });
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetInputChange = (e) => {
    const { name, value } = e.target;
    setResetFormData({
      ...resetFormData,
      [name]: value
    });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (resetFormData.newPassword !== resetFormData.confirmPassword) {
      setResetError('Passwords do not match');
      logger.warn('Password reset validation failed - passwords do not match', { username: resetFormData.username });
      return;
    }

    if (resetFormData.newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long');
      logger.warn('Password reset validation failed - password too short', { username: resetFormData.username });
      return;
    }

    setResetLoading(true);
    logger.info('Password reset attempt started', { username: resetFormData.username });
    logger.trackEvent('PasswordResetAttempt', { username: resetFormData.username });

    try {
      await axios.post('/api/auth/reset-password', {
        username: resetFormData.username,
        securityQuestion: resetFormData.securityQuestion,
        securityAnswer: resetFormData.securityAnswer,
        newPassword: resetFormData.newPassword
      });

      logger.info('Password reset successful', { username: resetFormData.username });
      logger.trackEvent('PasswordResetSuccess', { username: resetFormData.username });

      setResetSuccess('Password reset successfully! You can now login with your new password.');
      setResetFormData({
        username: '',
        securityQuestion: '',
        securityAnswer: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess('');
      }, 2000);
    } catch (error) {
      logger.error('Password reset failed', error, {
        username: resetFormData.username,
        errorMessage: error.response?.data?.error,
        statusCode: error.response?.status
      });
      logger.trackEvent('PasswordResetFailure', {
        username: resetFormData.username,
        error: error.response?.data?.error || error.message
      });
      console.error('Password reset error:', error);
      setResetError(error.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const openResetModal = () => {
    logger.info('Password reset modal opened');
    logger.trackEvent('ForgotPasswordClicked');
    setShowResetModal(true);
    setResetError('');
    setResetSuccess('');
    setResetFormData({
      username: '',
      securityQuestion: '',
      securityAnswer: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Login</h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    autoComplete="username"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className="text-center mt-3">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={openResetModal}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="text-center mt-2">
                <p className="text-muted">
                  Don't have an account?{' '}
                  <Link to="/signup">Sign up</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reset Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResetModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                {resetError && (
                  <div className="alert alert-danger" role="alert">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="alert alert-success" role="alert">
                    {resetSuccess}
                  </div>
                )}

                <form onSubmit={handleResetPassword}>
                  <div className="mb-3">
                    <label htmlFor="reset-username" className="form-label">
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="reset-username"
                      name="username"
                      value={resetFormData.username}
                      onChange={handleResetInputChange}
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reset-securityQuestion" className="form-label">
                      Security Question <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="reset-securityQuestion"
                      name="securityQuestion"
                      value={resetFormData.securityQuestion}
                      onChange={handleResetInputChange}
                      required
                    >
                      <option value="">Select your security question...</option>
                      {securityQuestions.map((question, index) => (
                        <option key={index} value={question}>
                          {question}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reset-securityAnswer" className="form-label">
                      Security Answer <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="reset-securityAnswer"
                      name="securityAnswer"
                      value={resetFormData.securityAnswer}
                      onChange={handleResetInputChange}
                      required
                      placeholder="Enter your answer"
                      autoComplete="off"
                    />
                    <small className="form-text text-muted">
                      Answer is case-insensitive
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reset-newPassword" className="form-label">
                      New Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="reset-newPassword"
                      name="newPassword"
                      value={resetFormData.newPassword}
                      onChange={handleResetInputChange}
                      required
                      autoComplete="new-password"
                      minLength="6"
                    />
                    <small className="form-text text-muted">
                      Must be at least 6 characters
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="reset-confirmPassword" className="form-label">
                      Confirm New Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="reset-confirmPassword"
                      name="confirmPassword"
                      value={resetFormData.confirmPassword}
                      onChange={handleResetInputChange}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={resetLoading}
                    >
                      {resetLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowResetModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;