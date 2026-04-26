import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TherapistSignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    licenseNumber: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerTherapist, error, clearError } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing errors when user starts typing
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await registerTherapist(formData);
      // Registration successful, user will be automatically redirected
      alert('Registration successful! Welcome to Joyverse!');
      navigate('/therapist-dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center">
            <Users className="w-12 h-12 text-white mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white">Therapist Registration</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            <input
              type="text"
              name="licenseNumber"
              placeholder="License Number"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="6"
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-purple-600 hover:text-purple-800 font-semibold"
              >
                ← Back to Role Selection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TherapistSignUp;
