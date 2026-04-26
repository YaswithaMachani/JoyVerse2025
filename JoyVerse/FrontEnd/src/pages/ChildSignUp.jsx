import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChildSignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    email: '',
    parentEmail: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerChild, error, clearError } = useAuth();

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
      // Convert age to number
      const submitData = {
        ...formData,
        age: parseInt(formData.age)
      };
      
      await registerChild(submitData);
      // Registration successful, user will be automatically redirected
      alert('Registration successful! Welcome to Joyverse, little star!');
      navigate('/child-dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-yellow-400 to-orange-400 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-yellow-500 p-6 text-center">
            <Smile className="w-12 h-12 text-white mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-white">Welcome Little Star! ⭐</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <input
              type="text"
              name="childName"
              placeholder="Your Name"
              value={formData.childName}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
            />
            <input
              type="number"
              name="age"
              placeholder="Your Age"
              value={formData.age}
              onChange={handleInputChange}
              required
              min="3"
              max="18"
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
            />
            <input
              type="email"
              name="parentEmail"
              placeholder="Parent's Email"
              value={formData.parentEmail}
              onChange={handleInputChange}
              required
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
            />
            <input
              type="password"
              name="password"
              placeholder="Create a Password (min 6 characters)"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength="6"
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:border-pink-500 focus:outline-none text-lg"
            />
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Joining the Fun...' : 'Join the Fun! 🎉'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-pink-600 hover:text-pink-800 font-semibold"
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

export default ChildSignUp;
