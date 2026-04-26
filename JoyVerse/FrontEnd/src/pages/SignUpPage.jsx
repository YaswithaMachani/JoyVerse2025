import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Smile } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-8">
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Join Joyverse! 🌟</h2>
          <p className="text-white">Choose your role to get started</p>
        </div>
        
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <button
              onClick={() => {
                navigate('/signup/therapist');
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Users className="w-6 h-6" />
              I'm a Therapist 👩‍⚕️
            </button>
            
            <button
              onClick={() => {
                navigate('/signup/child');
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Smile className="w-6 h-6" />
              I'm a Child 🧒
            </button>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-gray-600">Already have an account?</p>
            <button
              onClick={() => navigate('/login')}
              className="text-purple-600 hover:text-purple-800 font-semibold"
            >
              Sign In
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-800 font-semibold"
            >
              ← Back to Welcome
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SignUpPage;
