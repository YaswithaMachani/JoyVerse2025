const API_BASE_URL = 'http://localhost:5000/api/auth';
const SUPERADMIN_BASE_URL = 'http://localhost:5000/api/superadmin';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('joyverse_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

export const authAPI = {
  // Register Therapist
  registerTherapist: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register/therapist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await handleResponse(response);
    
    // Store token and user data
    if (data.token) {
      localStorage.setItem('joyverse_token', data.token);
      localStorage.setItem('joyverse_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Register Child
  registerChild: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register/child`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    const data = await handleResponse(response);
    
    // Store token and user data
    if (data.token) {
      localStorage.setItem('joyverse_token', data.token);
      localStorage.setItem('joyverse_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Login
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    const data = await handleResponse(response);
    
    // Store token and user data
    if (data.token) {
      localStorage.setItem('joyverse_token', data.token);
      localStorage.setItem('joyverse_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('joyverse_token');
    localStorage.removeItem('joyverse_user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('joyverse_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('joyverse_token');
    return !!token;
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-token`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      return await handleResponse(response);
    } catch (error) {
      // If token verification fails, clear stored data
      authAPI.logout();
      throw error;
    }  },

  // Check if email is registered
  checkRegistration: async (email) => {
    const response = await fetch(`${API_BASE_URL}/check-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    return await handleResponse(response);
  },

  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  },

  // SuperAdmin login
  loginSuperAdmin: async (email, password) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await handleResponse(response);
    
    // Store token and user data
    if (data.token) {
      localStorage.setItem('joyverse_token', data.token);
      localStorage.setItem('joyverse_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // SuperAdmin - Create new therapist account
  createTherapistAccount: async (therapistData) => {
     const response = await fetch(`${SUPERADMIN_BASE_URL}/create-therapist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(therapistData)
    });
    
    return await handleResponse(response);
  },

  // SuperAdmin - Create new child account
  createChildAccount: async (childData) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/create-child`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(childData)
    });
    
    return await handleResponse(response);
  },

  // SuperAdmin - Get all users
  getAllUsers: async () => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  },

  // SuperAdmin - Verify therapist
  verifyTherapist: async (therapistId) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/verify-therapist/${therapistId}`,{
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  },

  // SuperAdmin - Delete user account
  deleteUserAccount: async (userId) => {
    const response = await fetch(`${SUPERADMIN_BASE_URL}/delete-user/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    return await handleResponse(response);
  },
};

export default authAPI;
