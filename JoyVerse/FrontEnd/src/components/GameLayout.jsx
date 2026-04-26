import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const GameLayout = ({ title, onBack, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-white font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
            {title}
          </h1>
          
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default GameLayout;