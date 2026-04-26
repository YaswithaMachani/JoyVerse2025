import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  WelcomePage,
  SignUpPage,
  TherapistSignUp,
  ChildSignUp,
  LoginPage,
  ChildDashboard,
  TherapistDashboard,
  MissingLetterPopPage,
  ArtStudioPage
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
    return <Navigate to="/" replace />;
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
            onClick={() => window.location.href = '/'} 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:scale-105 transition-transform"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <Navigate to={`/${user.userType}-dashboard`} replace />;
};

const JoyverseAppContent = () => {
  return (
    <div className="font-sans">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signup/therapist" element={<TherapistSignUp />} />
        <Route path="/signup/child" element={<ChildSignUp />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route 
          path="/child-dashboard" 
          element={
            <ProtectedRoute requiredUserType="child">
              <ChildDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/therapist-dashboard" 
          element={
            <ProtectedRoute requiredUserType="therapist">
              <TherapistDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Game Routes */}
        <Route 
          path="/games/missing-letter-pop" 
          element={
            <ProtectedRoute requiredUserType="child">
              <MissingLetterPopPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/games/art-studio" 
          element={
            <ProtectedRoute requiredUserType="child">
              <ArtStudioPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
