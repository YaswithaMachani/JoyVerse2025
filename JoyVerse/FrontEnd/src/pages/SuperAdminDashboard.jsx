import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/authAPI';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('therapists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accountType, setAccountType] = useState('therapist');
  
  // New account form state
  const [newAccountData, setNewAccountData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    specialization: '',
    parentEmail: ''
  });
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Fetch all users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authAPI.getAllUsers();
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter users by userType
  const filteredUsers = users.filter(user => {
    if (activeTab === 'therapists') return user.userType === 'therapist';
    if (activeTab === 'children') return user.userType === 'child';
    return true;
  });
  
  // Handle input change for new account form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccountData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Create new account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (accountType === 'therapist') {
        const { name, email, password, specialization } = newAccountData;
        await authAPI.createTherapistAccount({
          name,
          email,
          password,
          specialization,
          isVerified: true // Automatically verified since created by superadmin
        });
      } else {
        const { name, email, password, age, parentEmail } = newAccountData;
        await authAPI.createChildAccount({
          name,
          email,
          password,
          age: parseInt(age),
          parentEmail
        });
      }
      
      // Reset form and close modal
      setNewAccountData({
        name: '',
        email: '',
        password: '',
        age: '',
        specialization: '',
        parentEmail: ''
      });
      setShowCreateModal(false);
      
      // Refresh user list
      fetchUsers();
      
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  // Verify therapist
  const handleVerifyTherapist = async (therapistId) => {
    try {
      setLoading(true);
      await authAPI.verifyTherapist(therapistId);
      // Update local state to reflect change
      setUsers(users.map(user => 
        user._id === therapistId 
          ? {...user, isVerified: true} 
          : user
      ));
    } catch (err) {
      setError(err.message || 'Failed to verify therapist');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete user account
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await authAPI.deleteUserAccount(userId);
      // Remove from local state
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  if (!user || user.userType !== 'superadmin') {
    return (
      <div className="unauthorized-message">
        <h2>Unauthorized Access</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }
  
  return (
    <div className="superadmin-dashboard">
      <header className="dashboard-header">
        <div className="logo">
          <h1>JoyVerse</h1>
          <span className="superadmin-badge">SuperAdmin</span>
        </div>
        <div className="user-actions">
          <span>Logged in as: {user.name || user.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'therapists' ? 'active' : ''} 
            onClick={() => setActiveTab('therapists')}
          >
            Therapists
          </button>
          <button 
            className={activeTab === 'children' ? 'active' : ''} 
            onClick={() => setActiveTab('children')}
          >
            Children
          </button>
        </div>
        
        <div className="action-bar">
          <h2>{activeTab === 'therapists' ? 'Manage Therapists' : 'Manage Children'}</h2>
          <button 
            className="create-btn"
            onClick={() => {
              setAccountType(activeTab === 'therapists' ? 'therapist' : 'child');
              setShowCreateModal(true);
            }}
          >
            Create New {activeTab === 'therapists' ? 'Therapist' : 'Child'} Account
          </button>
        </div>
        
        {loading && <div className="loading">Loading...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Created At</th>
                <th>Last Login</th>
                {activeTab === 'therapists' && <th>License/Specialization</th>}
                {activeTab === 'therapists' && <th>Phone</th>}
                {activeTab === 'therapists' && <th>Status</th>}
                {activeTab === 'children' && <th>Age</th>}
                {activeTab === 'children' && <th>Parent Email</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'therapists' ? 8 : 7} className="no-data">
                    No {activeTab} found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className={!user.isActive ? 'inactive-user' : ''}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                    {activeTab === 'therapists' && (
                      <>
                        <td>{user.specialization}</td>
                        <td>{user.phoneNumber}</td>
                        <td>
                          {user.isVerified ? (
                            <span className="verified-badge">Verified</span>
                          ) : (
                            <button 
                              className="verify-btn"
                              onClick={() => handleVerifyTherapist(user._id)}
                            >
                              Verify
                            </button>
                          )}
                        </td>
                      </>
                    )}
                    {activeTab === 'children' && <td>{user.age}</td>}
                    {activeTab === 'children' && <td>{user.parentEmail}</td>}
                    <td>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
      
      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New {accountType === 'therapist' ? 'Therapist' : 'Child'} Account</h2>
            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={newAccountData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newAccountData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={newAccountData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              {accountType === 'therapist' && (
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={newAccountData.specialization}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
              
              {accountType === 'child' && (
                <>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      min="3"
                      max="18"
                      value={newAccountData.age}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Parent Email</label>
                    <input
                      type="email"
                      name="parentEmail"
                      value={newAccountData.parentEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
