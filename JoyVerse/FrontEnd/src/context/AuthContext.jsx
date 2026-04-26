import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/authAPI';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SUPERADMIN_LOGIN: 'SUPERADMIN_LOGIN'
};

// Initial State
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        if (authAPI.isAuthenticated()) {
          // Verify token is still valid
          const userData = await authAPI.verifyToken();
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData.user });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      // Check if this is a superadmin login attempt
      if (email.includes('@admin')) {
        const response = await authAPI.loginSuperAdmin(email, password);
        
        // Store token and user data for superadmin
        if (response.token) {
          localStorage.setItem('joyverse_token', response.token);
          localStorage.setItem('joyverse_user', JSON.stringify(response.user));
        }
        
        // The user object should already have userType: 'superadmin' from the backend
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_SUCCESS, 
          payload: response.user
        });
        return response;
      } else {
        // Regular user login
        const response = await authAPI.login(email, password);
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
        return response;
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Register Therapist function
  const registerTherapist = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.registerTherapist(userData);
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      
      return response;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Register Child function
  const registerChild = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.registerChild(userData);
      
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.user });
      
      return response;
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    authAPI.logout();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: null });
  };

  const value = {
    ...state,
    login,
    registerTherapist,
    registerChild,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
