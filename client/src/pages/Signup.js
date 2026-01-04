import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getLogger } from '../services/logger';

const logger = getLogger();

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    birthday: '',
    contact: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.info('Signup page loaded');
    logger.trackPageView('Signup', window.location.href);
  }, []);

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      logger.warn('Signup validation failed - passwords do not match', { username: formData.username });
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      logger.warn('Signup validation failed - password too short', { username: formData.username });
      return;
    }

    setLoading(true);
    logger.info('Signup attempt started', {
      username: formData.username,
      firstname: formData.firstname,
      lastname: formData.lastname
    });
    logger.trackEvent('SignupAttempt', { username: formData.username });

    try {
      const signupData = {
        username: formData.username,
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        birthday: formData.birthday || null,
        contact: formData.contact,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      };

      await axios.post('/api/auth/signup', signupData);
      logger.info('Signup successful', { username: formData.username });
      logger.trackEvent('SignupSuccess', { username: formData.username });

      // Auto-login after successful signup
      const loginResponse = await axios.post('/api/auth/login', {
        username: formData.username,
        password: formData.password
      });

      const { token, user } = loginResponse.data;
      logger.info('Auto-login after signup successful', { username: user.username, role: user.role });

      // Set user context in logger
      logger.setUser(user.username, user.id);

      // Use AuthContext login function
      login(user, token);

      // Redirect to profile page
      navigate('/profile');
    } catch (error) {
      logger.error('Signup failed', error, {
        username: formData.username,
        errorMessage: error.response?.data?.error,
        statusCode: error.response?.status
      });
      logger.trackEvent('SignupFailure', {
        username: formData.username,
        error: error.response?.data?.error || error.message
      });
      console.error('Signup error:', error);
      setError(error.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Sign Up</h2>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <h5 className="mb-3">Account Information</h5>

                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username <span className="text-danger">*</span>
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
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    minLength="6"
                  />
                  <small className="form-text text-muted">
                    Must be at least 6 characters
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <hr className="my-4" />
                <h5 className="mb-3">Player Information</h5>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="firstname" className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstname"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="lastname" className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastname"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="birthday" className="form-label">
                    Birthday (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    placeholder="MM-DD (e.g., 03-15)"
                    pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                    title="Please enter date in MM-DD format (e.g., 03-15)"
                  />
                  <small className="form-text text-muted">
                    Enter month and day (MM-DD format, year not required)
                  </small>
                </div>

                <div className="mb-3">
                  <label htmlFor="contact" className="form-label">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="contact"
                    name="contact"
                    value={formData.contact}
                    onChange={handleInputChange}
                    placeholder="e.g., +91 98765 43210"
                  />
                </div>

                <hr className="my-4" />
                <h5 className="mb-3">Security Question</h5>
                <small className="text-muted d-block mb-3">
                  This will be used to reset your password if you forget it
                </small>

                <div className="mb-3">
                  <label htmlFor="securityQuestion" className="form-label">
                    Select a Security Question <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="securityQuestion"
                    name="securityQuestion"
                    value={formData.securityQuestion}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Choose a question...</option>
                    {securityQuestions.map((question, index) => (
                      <option key={index} value={question}>
                        {question}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="securityAnswer" className="form-label">
                    Your Answer <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="securityAnswer"
                    name="securityAnswer"
                    value={formData.securityAnswer}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your answer"
                    autoComplete="off"
                  />
                  <small className="form-text text-muted">
                    Answer is case-insensitive
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              <div className="text-center mt-3">
                <p className="text-muted">
                  Already have an account?{' '}
                  <Link to="/login">Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
