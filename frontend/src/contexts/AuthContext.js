import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

// Define user interface
const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on page load
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try different endpoint paths for user info
      const checkAuth = async () => {
        try {
          // Try first endpoint pattern
          console.log('Checking authentication with /auth/me');
          const response = await api.get('/auth/me');
          setCurrentUser(response.data);
          console.log('Auth check successful:', response.data);
        } catch (err) {
          try {
            // Try second endpoint pattern
            console.log('Retrying with /api/auth/me');
            const response = await api.get('/api/auth/me');
            setCurrentUser(response.data);
            console.log('Auth check successful with alternate endpoint:', response.data);
          } catch (err) {
            try {
              // Try third endpoint pattern
              console.log('Retrying with /users/me');
              const response = await api.get('/users/me');
              setCurrentUser(response.data);
              console.log('Auth check successful with users endpoint:', response.data);
            } catch (err) {
              try {
                // Try fourth endpoint pattern
                console.log('Retrying with /me');
                const response = await api.get('/me');
                setCurrentUser(response.data);
                console.log('Auth check successful with simple endpoint:', response.data);
              } catch (err) {
                try {
                  // Try fifth endpoint pattern
                  console.log('Retrying with /api/users/me');
                  const response = await api.get('/api/users/me');
                  setCurrentUser(response.data);
                  console.log('Auth check successful with api users endpoint:', response.data);
                } catch (err) {
                  console.error('Failed to verify authentication:', err);
                  localStorage.removeItem('token');
                  delete api.defaults.headers.common['Authorization'];
                }
              }
            }
          }
        } finally {
          setLoading(false);
        }
      };
      
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    // Try different endpoint patterns for login
    const tryLogin = async (endpoint) => {
      console.log(`Attempting login with endpoint: ${endpoint}`);
      try {
        const response = await api.post(endpoint, { email, password });
        console.log('Login successful:', response.data);
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        setError(null);
        return true;
      } catch (err) {
        console.error(`Login failed with ${endpoint}:`, err.response?.status, err.response?.data);
        return false;
      }
    };

    // Try different endpoint patterns
    const endpoints = [
      '/auth/login', 
      '/api/auth/login', 
      '/users/login', 
      '/login',
      '/api/users/login',
      '/api/login',
      '/user/login'
    ];
    
    for (const endpoint of endpoints) {
      const success = await tryLogin(endpoint);
      if (success) return;
    }
    
    // If all attempts fail
    setError('Failed to login. Please check your credentials or contact support.');
    throw new Error('Login failed with all endpoint attempts');
  };

  const register = async (email, password, firstName, lastName) => {
    // Define all possible endpoint patterns to try
    const endpoints = [
      '/auth/register',
      '/api/auth/register',
      '/api/users',
      '/users',
      '/register',
      '/users/register',
      '/signup',
      '/api/signup',
      '/api/register',
      '/user/register',
      '/api/users/register'
    ];
    
    // Try each endpoint with detailed logging
    for (const endpoint of endpoints) {
      try {
        console.log(`Attempting registration with endpoint: ${endpoint}`);
        console.log('Registration payload:', { email, password, firstName, lastName });
        
        const response = await api.post(endpoint, { email, password, firstName, lastName });
        console.log(`Registration successful with ${endpoint}:`, response.data);
        
        // Handle successful registration
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        setError(null);
        return;
      } catch (err) {
        console.error(`Registration failed with ${endpoint}:`, err.response?.status);
        console.error('Error details:', err.response?.data);
        console.error('Request URL:', err.config?.url);
        // Continue to the next endpoint if this one failed
      }
    }
    
    // If all endpoints failed
    setError('Failed to register. Please try again or contact support.');
    throw new Error('Registration failed with all endpoint attempts');
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
