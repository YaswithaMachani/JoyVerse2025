import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Smile, Users, Award, Palette } from 'lucide-react';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 animate-bounce">
          <Star className="text-yellow-300 w-8 h-8" fill="currentColor" />
        </div>
        <div className="absolute top-40 right-32 animate-pulse">
          <Heart className="text-red-300 w-10 h-10" fill="currentColor" />
        </div>
        <div className="absolute bottom-40 left-40 animate-bounce delay-500">
          <Smile className="text-green-300 w-12 h-12" fill="currentColor" />
        </div>
        <div className="absolute top-60 left-1/2 animate-pulse delay-1000">
          <Star className="text-blue-300 w-6 h-6" fill="currentColor" />
        </div>
        <div className="absolute bottom-60 right-20 animate-bounce delay-700">
          <Heart className="text-pink-300 w-8 h-8" fill="currentColor" />
        </div>
        
        {/* Cloud shapes */}
        <div className="absolute top-10 right-10 w-20 h-12 bg-white bg-opacity-20 rounded-full"></div>
        <div className="absolute top-32 left-1/3 w-16 h-10 bg-white bg-opacity-15 rounded-full"></div>
        <div className="absolute bottom-20 left-10 w-24 h-14 bg-white bg-opacity-20 rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Welcome to
          </h1>
          <h2 className="text-7xl font-extrabold text-yellow-200 mb-2 drop-shadow-lg">
            Joyverse
          </h2>
          <p className="text-2xl text-white font-semibold drop-shadow-md">
            ✨ Taare Zameen Par ✨
          </p>
          <div className="mt-6 text-xl text-white drop-shadow-md">
            Where every child shines like a star! 🌟
          </div>
        </div>

        <div className="bg-white bg-opacity-90 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-purple-700 mb-4">
              Join Our Magical Journey! 🚀
            </h3>
            <p className="text-gray-700 text-lg">
              A safe space for children to learn, grow, and discover their unique talents
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🌟 Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🔑 Login
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="bg-white bg-opacity-80 rounded-2xl p-6 text-center shadow-lg">
            <Palette className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h4 className="font-bold text-purple-700 text-lg mb-2">Creative Learning</h4>
            <p className="text-gray-600">Express yourself through art, music, and stories</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-2xl p-6 text-center shadow-lg">
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h4 className="font-bold text-blue-700 text-lg mb-2">Safe Community</h4>
            <p className="text-gray-600">Connect with caring therapists and friends</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-2xl p-6 text-center shadow-lg">
            <Award className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="font-bold text-green-700 text-lg mb-2">Celebrate Growth</h4>
            <p className="text-gray-600">Track progress and celebrate achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
