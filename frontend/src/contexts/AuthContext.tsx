import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiService from '../services/api';
import { User, AuthState, LoginCredentials, RegisterData } from '../types';

// Define the auth context state
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth reducer actions
type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_REQUEST' }
  | { type: 'REGISTER_SUCCESS' }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_CHECK_SUCCESS'; payload: User }
  | { type: 'AUTH_CHECK_FAILURE' };

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    case 'AUTH_CHECK_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false
      };
    case 'AUTH_CHECK_FAILURE':
      return {
        ...initialState
      };
    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthentication = async () => {
      await checkAuth();
    };
    checkAuthentication();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'LOGIN_REQUEST' });
    try {
      const response = await apiService.auth.login(credentials.email, credentials.password);
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data.user });
        return true;
      } else {
        dispatch({ 
          type: 'LOGIN_FAILURE', 
          payload: response.error?.message || 'Login failed' 
        });
        return false;
      }
    } catch (error: any) {
      dispatch({ 
        type: 'LOGIN_FAILURE', 
        payload: error.message || 'Login failed' 
      });
      return false;
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<boolean> => {
    dispatch({ type: 'REGISTER_REQUEST' });
    try {
      const response = await apiService.auth.register(data);
      
      if (response.success) {
        dispatch({ type: 'REGISTER_SUCCESS' });
        return true;
      } else {
        dispatch({ 
          type: 'REGISTER_FAILURE', 
          payload: response.error?.message || 'Registration failed' 
        });
        return false;
      }
    } catch (error: any) {
      dispatch({ 
        type: 'REGISTER_FAILURE', 
        payload: error.message || 'Registration failed' 
      });
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  // Check authentication status
  const checkAuth = async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch({ type: 'AUTH_CHECK_FAILURE' });
      return false;
    }

    try {
      const response = await apiService.auth.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_CHECK_SUCCESS', payload: response.data });
        return true;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'AUTH_CHECK_FAILURE' });
        return false;
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'AUTH_CHECK_FAILURE' });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
