// Game Score API Service
const API_BASE_URL = 'http://localhost:5000/api';

class GameScoreService {  // Get auth token from localStorage
  getAuthToken() {
    const token = localStorage.getItem('joyverse_token');
    console.log('🔑 Auth token found:', token ? '✅ Token exists' : '❌ No token');
    return token;
  }

  // Common headers for API requests
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  // Save a new game score
  async saveGameScore(gameData) {
    try {
      console.log('🎮 Attempting to save game score:', gameData);
      
      const response = await fetch(`${API_BASE_URL}/game-scores`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(gameData)
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || 'Failed to save game score');
      }

      const result = await response.json();
      console.log('✅ Game score saved successfully:', result);
      return result;
    } catch (error) {
      console.error('💥 Error saving game score:', error);
      throw error;
    }
  }

  // Get user's game scores with pagination
  async getGameScores(options = {}) {
    try {
      const { gameType, limit = 10, page = 1 } = options;
      const params = new URLSearchParams();
      
      if (gameType) params.append('gameType', gameType);
      params.append('limit', limit.toString());
      params.append('page', page.toString());

      const response = await fetch(`${API_BASE_URL}/game-scores?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch game scores');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching game scores:', error);
      throw error;
    }
  }

  // Get user's best scores by game type
  async getBestScores() {
    try {
      const response = await fetch(`${API_BASE_URL}/game-scores/best`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch best scores');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching best scores:', error);
      throw error;
    }
  }

  // Get game statistics
  async getGameStats(gameType = null) {
    try {
      const params = gameType ? `?gameType=${gameType}` : '';
      const response = await fetch(`${API_BASE_URL}/game-scores/stats${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch game statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching game statistics:', error);
      throw error;
    }
  }

  // Delete a game score
  async deleteGameScore(scoreId) {
    try {
      const response = await fetch(`${API_BASE_URL}/game-scores/${scoreId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete game score');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting game score:', error);
      throw error;
    }
  }

  // Helper method to format game data for specific games
  formatGameData(gameType, gameSpecificData) {
    const baseData = {
      gameType,
      playedAt: new Date().toISOString()
    };

    switch (gameType) {
      case 'pacman':
        return {
          ...baseData,
          score: gameSpecificData.score || 0,
          maxScore: gameSpecificData.maxScore,
          timeTaken: gameSpecificData.timeTaken || 0,
          level: gameSpecificData.level || 1,
          gameData: {
            dotsEaten: gameSpecificData.dotsEaten,
            totalDots: gameSpecificData.totalDots,
            accuracy: gameSpecificData.accuracy,
            level: gameSpecificData.level
          }
        };

      case 'missing-letter-pop':
        return {
          ...baseData,
          score: gameSpecificData.score || 0,
          maxScore: gameSpecificData.maxScore,
          timeTaken: gameSpecificData.timeTaken,
          level: gameSpecificData.level || 1,
          gameData: {
            correctAnswers: gameSpecificData.correctAnswers,
            totalQuestions: gameSpecificData.totalQuestions,
            mistakes: gameSpecificData.mistakes,
            wordsCompleted: gameSpecificData.wordsCompleted
          }
        };

      case 'space-math':
        return {
          ...baseData,
          score: gameSpecificData.score || 0,
          maxScore: gameSpecificData.maxScore,
          timeTaken: gameSpecificData.timeTaken,
          level: gameSpecificData.level || 1,
          gameData: {
            problemsSolved: gameSpecificData.problemsSolved,
            totalProblems: gameSpecificData.totalProblems,
            accuracy: gameSpecificData.accuracy,
            currentPlanet: gameSpecificData.currentPlanet,
            mathOperations: gameSpecificData.mathOperations,
            emotionsDetected: gameSpecificData.emotionsDetected || [],
            planetsVisited: gameSpecificData.planetsVisited || []
          }
        };

      default:
        return {
          ...baseData,
          score: gameSpecificData.score || 0,
          gameData: gameSpecificData
        };
    }
  }

  // Get children data for therapists
  async getChildrenData() {
    try {
      console.log('🩺 Fetching children data for therapist...');
      
      const response = await fetch(`${API_BASE_URL}/therapist/children`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      console.log('📡 Children data response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Children data fetch error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch children data');
      }

      const result = await response.json();
      console.log('✅ Children data fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('💥 Error fetching children data:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const gameScoreService = new GameScoreService();
export default gameScoreService;
