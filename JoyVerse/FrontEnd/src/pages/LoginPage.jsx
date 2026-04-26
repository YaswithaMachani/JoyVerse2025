import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/authAPI';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { login, error, clearError } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing errors when user starts typing
    if (error) clearError();
    if (emailError) setEmailError('');
  };

  // Check if email is registered when user finishes typing
  const handleEmailBlur = async () => {
    if (formData.email && formData.email.includes('@')) {
      setIsCheckingRegistration(true);
      try {
        const result = await authAPI.checkRegistration(formData.email);
        if (!result.isRegistered) {
          setEmailError('This email is not registered. Please sign up first to access the system.');
        }
      } catch (error) {
        console.error('Registration check failed:', error);
      } finally {
        setIsCheckingRegistration(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is registered before attempting login
    if (emailError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login(formData.email, formData.password);
      alert(`Welcome back! Logged in as ${response.user.userType}`);
      
      // Redirect based on user type
      if (response.user.userType === 'child') {
        navigate('/child-dashboard');
      } else if (response.user.userType === 'therapist') {
        navigate('/therapist-dashboard');
      } else {
        navigate('/dashboard'); // fallback to general dashboard redirect
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back! 🌟</h2>
            <p className="text-white">Sign in to continue your journey</p>
          </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleEmailBlur}
                required
                className="w-full p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
              />
              {isCheckingRegistration && (
                <p className="text-blue-600 text-sm mt-2 flex items-center">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></span>
                  Checking registration...
                </p>
              )}
              {emailError && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg mt-2 text-sm">
                  {emailError}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="underline ml-2 font-semibold hover:text-yellow-800"
                  >
                    Sign up here
                  </button>
                </div>
              )}
            </div>
            
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
            />
            
            <button
              type="submit"
              disabled={isSubmitting || emailError || isCheckingRegistration}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
            
            <div className="text-center space-y-2">
              <p className="text-gray-600">Don't have an account?</p>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Create Account
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                ← Back to Welcome
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
