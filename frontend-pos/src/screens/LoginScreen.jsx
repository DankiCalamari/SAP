import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import api from '../api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  // Load remembered username on mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('pos_remembered_user');
    if (rememberedUser) {
      setUsername(rememberedUser);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(username, password);

      // Store auth data
      setAuth(response.data);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('pos_remembered_user', username);
      } else {
        localStorage.removeItem('pos_remembered_user');
      }

      // Navigation handled by App.jsx based on user state
    } catch (err) {
      setLoading(false);

      // Handle different error types
      if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        setError('Unable to connect. Check your internet connection.');
      } else if (err.code === 'ETIMEDOUT') {
        setError('Request timed out. Try again.');
      } else if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          setError('Invalid credentials');
        } else if (err.response.status >= 500) {
          setError('Server error, try again');
        } else {
          setError(err.response.data?.message || 'Login failed');
        }
      } else {
        setError('Unable to connect. Check your internet connection.');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>SAP POS System</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.formGroup}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Remember Me</span>
            </label>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '400px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 0,
    marginBottom: '24px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '16px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d0d0d0',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  checkboxGroup: {
    marginBottom: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#666666',
  },
  error: {
    padding: '12px',
    marginBottom: '16px',
    backgroundColor: '#ffebee',
    color: '#f44336',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#2196f3',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonDisabled: {
    backgroundColor: '#90caf9',
    cursor: 'not-allowed',
  },
};
