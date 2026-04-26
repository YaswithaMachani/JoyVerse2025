import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, Target, TrendingUp, Award } from 'lucide-react';
import gameScoreService from '../services/gameScoreAPI';

const GameStats = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [bestScores, setBestScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load game statistics
  useEffect(() => {
    const loadGameStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get overall game statistics
        const statsResponse = await gameScoreService.getGameStats();
        setStats(statsResponse.stats);

        // Get best scores for each game - filter to only show our three games
        const bestScoresResponse = await gameScoreService.getBestScores();
        const allowedGames = ['pacman', 'missing-letter-pop', 'space-math'];
        const filteredBestScores = (bestScoresResponse.bestScores || []).filter(
          score => allowedGames.includes(score.gameType)
        );
        setBestScores(filteredBestScores);

      } catch (error) {
        console.error('Failed to load game statistics:', error);
        setError('Failed to load game statistics');
      } finally {
        setLoading(false);
      }
    };

    loadGameStats();
  }, [user]);

  const getGameDisplayName = (gameType) => {
    switch (gameType) {
      case 'pacman': return '🟡 PacMan Quest';
      case 'missing-letter-pop': return '🔤 Missing Letter Pop';
      case 'space-math': return '🚀 Space Math';
      default: return gameType;
    }
  };

  const getGameIcon = (gameType) => {
    switch (gameType) {
      case 'pacman': return '🟡';
      case 'missing-letter-pop': return '🔤';
      case 'space-math': return '🚀';
      default: return '🎮';
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        textAlign: 'center',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <p>Loading your amazing progress...</p>
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        textAlign: 'center',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌟</div>
        <h3 style={{ color: '#333', marginBottom: '1rem' }}>Start Your Gaming Journey!</h3>
        <p style={{ color: '#666' }}>Play some games to see your awesome stats here!</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '2rem',
      margin: '1rem 0',
      border: '3px solid #feca57'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{
          color: '#333',
          fontSize: '1.8rem',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Trophy color="#feca57" size={24} />
          {user?.childName || 'Your'}'s Gaming Stats
        </h3>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Look at all the amazing progress you've made! 🌟</p>
      </div>

      {/* Overall Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
          borderRadius: '15px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <Target size={24} style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalGames}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Games Played</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
          borderRadius: '15px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <Star size={24} style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.bestScore}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Best Score</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #45b7d1, #96c93d)',
          borderRadius: '15px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <TrendingUp size={24} style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.averageScore}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Average Score</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #feca57, #ff9ff3)',
          borderRadius: '15px',
          padding: '1.5rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <Clock size={24} style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatTime(stats.totalTimePlayed)}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Time Played</div>
        </div>
      </div>

      {/* Best Scores by Game - Only show PacMan and Missing Letter Pop */}
      {bestScores && bestScores.length > 0 && (
        <div>
          <h4 style={{
            color: '#333',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Award color="#feca57" size={20} />
            Your Best Scores
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {bestScores.map((gameScore, index) => (
              <div
                key={gameScore.gameType}
                style={{
                  background: `linear-gradient(135deg, ${
                    index === 0 ? '#ff6b6b, #ff8e8e' :
                    index === 1 ? '#4ecdc4, #44a08d' :
                    '#45b7d1, #96c93d'
                  })`,
                  borderRadius: '15px',
                  padding: '1.5rem',
                  color: 'white',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  {getGameIcon(gameScore.gameType)}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {getGameDisplayName(gameScore.gameType)}
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {gameScore.bestScore}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.3rem' }}>
                  Best Score
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Played {gameScore.totalGames} time{gameScore.totalGames !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  Avg: {gameScore.averageScore}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        textAlign: 'center',
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(254, 202, 87, 0.1)',
        borderRadius: '15px'
      }}>
        <p style={{
          color: '#333',
          fontSize: '1.1rem',
          margin: 0,
          fontWeight: '600'
        }}>
          🌟 Keep playing to unlock more achievements and improve your scores! 🌟
        </p>
      </div>
    </div>
  );
};

export default GameStats;
