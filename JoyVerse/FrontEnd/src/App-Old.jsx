import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  WelcomePage,
  SignUpPage,
  TherapistSignUp,
  ChildSignUp,
  LoginPage,
  ChildDashboard,
  TherapistDashboard
} from './pages';

// Protected Route Component
const ProtectedRoute = ({ children, requiredUserType = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your magical journey...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-orange-400">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">You need to be registered and logged in to access this page.</p>
          <WelcomePage />
        </div>
      </div>
    );
  }

  // Check if user has required user type
  if (requiredUserType && user?.userType !== requiredUserType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 to-red-400">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

const JoyverseAppContent = () => {
  const [currentPage, setCurrentPage] = useState('welcome');
  const { user, isAuthenticated, logout } = useAuth();  // Auto-redirect to dashboard if user is logged in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (currentPage === 'welcome') {
        // Redirect to appropriate dashboard based on user type
        if (user.userType === 'therapist') {
          setCurrentPage('therapist-dashboard');
        } else if (user.userType === 'child') {
          setCurrentPage('child-dashboard');
        }
      }
    }
  }, [isAuthenticated, user, currentPage]);

  // Handle logout
  const handleLogout = () => {
    logout();
    setCurrentPage('welcome');
  };

  // Route rendering
  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage setCurrentPage={setCurrentPage} />;
      case 'signup':
        return <SignUpPage setCurrentPage={setCurrentPage} />;
      case 'therapist-signup':
        return <TherapistSignUp setCurrentPage={setCurrentPage} />;
      case 'child-signup':
        return <ChildSignUp setCurrentPage={setCurrentPage} />;      case 'login':
        return <LoginPage setCurrentPage={setCurrentPage} />;
      case 'child-dashboard':
        return (
          <ProtectedRoute requiredUserType="child">
            <ChildDashboard handleLogout={handleLogout} />
          </ProtectedRoute>
        );
      case 'therapist-dashboard':
        return (
          <ProtectedRoute requiredUserType="therapist">
            <TherapistDashboard handleLogout={handleLogout} />
          </ProtectedRoute>
        );
      default:
        return <WelcomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="font-sans">
      {renderPage()}
    </div>
  );
};

const JoyverseApp = () => {
  return (
    <AuthProvider>
      <JoyverseAppContent />
    </AuthProvider>
  );
};

export default JoyverseApp;
