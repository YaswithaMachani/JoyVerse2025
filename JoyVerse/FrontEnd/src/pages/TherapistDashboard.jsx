import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Brain, Target, Award, Clock, Users, Activity, ArrowLeft, MessageCircle, Plus, Edit3, Save, X, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import gameScoreService from '../services/gameScoreAPI';
import '../styles/TherapistDashboard.css';

const TherapistDashboard = ({ handleLogout }) => {
  const { user, logout } = useAuth();
  const [selectedChild, setSelectedChild] = useState(null);
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comments state management
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [showCommentsFor, setShowCommentsFor] = useState(null);

  useEffect(() => {
    if (user && user.userType === 'therapist') {
      fetchChildrenData();
    }
  }, [user]);

  // Prevent scroll issues when comments section is active
  useEffect(() => {
    if (showCommentsFor || editingComment) {
      // Store original scroll behavior
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      
      // Set smooth scrolling off to prevent jumping
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Cleanup when comments section is closed
      return () => {
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
      };
    }
  }, [showCommentsFor, editingComment]);

  // Load comments from localStorage on component mount
  useEffect(() => {
    try {
      const savedComments = localStorage.getItem('therapist-comments');
      if (savedComments) {
        const parsedComments = JSON.parse(savedComments);
        console.log('💾 Loaded comments from localStorage:', parsedComments);
        setComments(parsedComments);
      }
    } catch (error) {
      console.error('❌ Error loading comments from localStorage:', error);
    }
  }, []);
  const fetchChildrenData = async () => {
    try {
      setLoading(true);
      console.log('🩺 TherapistDashboard: Fetching real children data...');
      
      // Fetch real children data from the backend
      const response = await gameScoreService.getChildrenData();
      
      if (response && response.children) {
        console.log(`✅ TherapistDashboard: Loaded ${response.children.length} children`);
        setChildrenData(response.children);
        
        // Log summary for debugging
        if (response.summary) {
          console.log('📊 Summary:', response.summary);
        }
      } else {
        console.warn('⚠️ No children data received');
        setChildrenData([]);
      }
    } catch (err) {
      console.error('❌ TherapistDashboard: Error fetching children data:', err);
      setError('Failed to load children data: ' + (err.message || 'Unknown error'));
      setChildrenData([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = (child) => {
    const allowedGames = ['pacman', 'missing-letter-pop'];
    const gameTypes = Object.keys(child.games).filter(game => allowedGames.includes(game));
    const avgScore = gameTypes.length > 0 ? Math.round(gameTypes.reduce((sum, game) => sum + child.games[game].score, 0) / gameTypes.length) : 0;
    const avgImprovement = gameTypes.length > 0 ? Math.round(gameTypes.reduce((sum, game) => sum + child.games[game].improvement, 0) / gameTypes.length) : 0;
    
    let cognitiveProfile = '';
    let recommendations = '';
    
    if (child.games['pacman']?.score > 85) {
      cognitiveProfile += 'Strong hand-eye coordination and quick reflexes. ';
    }
    if (child.games['missing-letter-pop']?.score > 80) {
      cognitiveProfile += 'Good linguistic processing and phonemic awareness. ';
    }
    if (child.games['missing-letter-pop']?.score > 85) {
      cognitiveProfile += 'Excellent mathematical reasoning and problem-solving skills. ';
    }
    
    if (avgImprovement > 12) {
      recommendations = 'Continue current intervention strategies. Consider advancing to more complex tasks to maintain engagement and challenge.';
    } else if (avgImprovement > 8) {
      recommendations = 'Moderate progress observed. Consider incorporating multi-sensory learning approaches and breaking tasks into smaller segments.';
    } else {
      recommendations = 'Progress slower than expected. Recommend increased session frequency, parental involvement, and exploring alternative learning modalities.';
    }

    return {
      cognitiveProfile: cognitiveProfile || 'Mixed cognitive profile with developing skills across domains.',
      recommendations,
      riskLevel: avgScore < 70 ? 'High Support Needed' : avgScore < 80 ? 'Moderate Support' : 'Low Support',
      progressTrend: avgImprovement > 10 ? 'Positive' : avgImprovement > 5 ? 'Stable' : 'Needs Attention'
    };
  };

  const getRadarData = (child) => [
    { subject: 'Coordination', A: child.games['pacman']?.score || 0 },
    { subject: 'Language', A: child.games['missing-letter-pop']?.score || 0 },
    { subject: 'Word Skills', A: child.games['missing-letter-pop']?.score || 0 },
    { subject: 'Speed', A: Math.max(0, 100 - (child.games['pacman']?.time || 100) / 2) },
    { subject: 'Accuracy', A: Math.max(0, 100 - (child.games['missing-letter-pop']?.attempts || 10) * 10) },
    { subject: 'Consistency', A: Math.min(100, child.overallProgress + 10) }
  ];

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
    <div className="therapist-glass-card therapist-stat-card">
      <div className="therapist-stat-content">
        <h3 className="therapist-stat-title">{title}</h3>
        <p className="therapist-stat-value">{value}</p>
        {trend && (
          <div className="therapist-stat-trend">
            {trend > 0 ? (
              <TrendingUp className="text-green-300" size={16} />
            ) : (
              <TrendingDown className="text-red-300" size={16} />
            )}
            <span className="therapist-trend-text">{Math.abs(trend)}% from last week</span>
          </div>
        )}
      </div>
      <div className={`therapist-stat-icon ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  const ChildCard = ({ child, onClick }) => {
    const analysis = generateAnalysis(child);
    const getRiskClass = (level) => {
      switch(level) {
        case 'High Support Needed': return 'therapist-risk-high';
        case 'Moderate Support': return 'therapist-risk-moderate';
        default: return 'therapist-risk-low';
      }
    };

    return (
      <div className="therapist-glass-card therapist-child-card" onClick={() => onClick(child)}>
        <div className="therapist-child-header">
          <h3 className="therapist-child-name">{child.name}</h3>
          <span className="therapist-child-age">Age: {child.age}</span>
        </div>
        
        <div className="therapist-child-scores">
          <div className="therapist-score-item">
            <p className="therapist-score-label">Coordination</p>
            <p className="therapist-score-value">{child.games['pacman']?.score || 0}</p>
          </div>
          <div className="therapist-score-item">
            <p className="therapist-score-label">Language</p>
            <p className="therapist-score-value">{child.games['missing-letter-pop']?.score || 0}</p>
          </div>
          <div className="therapist-score-item">
            <p className="therapist-score-label">Math Skills</p>
            <p className="therapist-score-value">{child.games['missing-letter-pop']?.score || 0}</p>
          </div>
        </div>
        
        <div className="therapist-progress-section">
          <div className="therapist-progress-header">
            <span>Overall Progress</span>
            <span>{child.overallProgress}%</span>
          </div>
          <div className="therapist-progress-bar">
            <div 
              className="therapist-progress-fill"
              style={{ width: `${child.overallProgress}%` }}
            ></div>
          </div>
        </div>
        
        <div className={`therapist-risk-badge ${getRiskClass(analysis.riskLevel)}`}>
          {analysis.riskLevel}
        </div>
        
        {/* Comments Toggle Button */}
        <div className="therapist-child-actions">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔘 Comments button clicked for child:', child.id, child.name);
              console.log('🔘 Current showCommentsFor:', showCommentsFor);
              const newValue = showCommentsFor === child.id ? null : child.id;
              console.log('🔘 Setting showCommentsFor to:', newValue);
              setShowCommentsFor(newValue);
            }}
            className="therapist-comments-toggle-btn"
          >
            <MessageCircle size={16} />
            {(comments[child.id] || []).length > 0 
              ? `${comments[child.id].length} Notes` 
              : 'Add Notes'
            }
          </button>
        </div>
      </div>
    );
  };

  const DetailedAnalysis = ({ child, onBack }) => {
    const analysis = generateAnalysis(child);
    const radarData = getRadarData(child);
    
    const getMetricClass = (value, type) => {
      if (type === 'trend') {
        return value === 'Positive' ? 'therapist-metric-positive' : 
               value === 'Stable' ? 'therapist-metric-warning' : 'therapist-metric-danger';
      } else {
        return value === 'Low Support' ? 'therapist-metric-positive' :
               value === 'Moderate Support' ? 'therapist-metric-warning' : 'therapist-metric-danger';
      }
    };
    
    return (
      <div>
        <div className="therapist-analysis-header">
          <h2 className="therapist-analysis-title">{child.name} - Detailed Analysis</h2>
          <button className="therapist-back-button" onClick={onBack}>
            <ArrowLeft size={20} />
            Back to Overview
          </button>
        </div>

        <div className="therapist-analysis-grid">
          <div className="therapist-glass-card therapist-chart-container">
            <h3 className="therapist-chart-title">Weekly Progress</h3>
            <div className="therapist-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={child.progressData}>
                  <CartesianGrid strokeDasharray="3,3" stroke="#ffffff30" />
                  <XAxis dataKey="week" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8884d8" 
                    fill="url(#colorScore)" 
                  />
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="therapist-glass-card therapist-chart-container">
            <h3 className="therapist-chart-title">Cognitive Profile</h3>
            <div className="therapist-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#ffffff30" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#ffffff80', fontSize: 10 }} />
                  <Radar 
                    name="Score" 
                    dataKey="A" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="therapist-game-performance-grid">
          <div className="therapist-glass-card therapist-game-card">
            <h4 className="therapist-game-title">� PacMan Quest</h4>
            <div className="therapist-game-stats">
              <div className="therapist-game-stat">
                <span>Score:</span>
                <span className="therapist-game-stat-value">{child.games['pacman'].score}</span>
              </div>
              <div className="therapist-game-stat">
                <span>Time:</span>
                <span>{child.games['pacman'].time}s</span>
              </div>
              <div className="therapist-game-stat">
                <span>Attempts:</span>
                <span>{child.games['pacman'].attempts}</span>
              </div>
              <div className="therapist-game-stat">
                <span>Improvement:</span>
                <span className="therapist-improvement-positive">+{child.games['pacman'].improvement}%</span>
              </div>
              <div className="therapist-game-stat">
                <span>Total Played:</span>
                <span>{child.games['pacman'].totalPlayed}</span>
              </div>
            </div>
          </div>

          <div className="therapist-glass-card therapist-game-card">
            <h4 className="therapist-game-title">🔤 Missing Letter Pop</h4>
            <div className="therapist-game-stats">
              <div className="therapist-game-stat">
                <span>Score:</span>
                <span className="therapist-game-stat-value">{child.games['missing-letter-pop'].score}</span>
              </div>
              <div className="therapist-game-stat">
                <span>Time:</span>
                <span>{child.games['missing-letter-pop'].time}s</span>
              </div>
              <div className="therapist-game-stat">
                <span>Attempts:</span>
                <span>{child.games['missing-letter-pop'].attempts}</span>
              </div>
              <div className="therapist-game-stat">
                <span>Improvement:</span>
                <span className="therapist-improvement-positive">+{child.games['missing-letter-pop'].improvement}%</span>
              </div>
              <div className="therapist-game-stat">
                <span>Total Played:</span>
                <span>{child.games['missing-letter-pop'].totalPlayed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="therapist-glass-card therapist-analysis-summary">
          <h3 className="therapist-summary-title">Cognitive Analysis & Recommendations</h3>
          <div className="therapist-summary-section">
            <h4>Cognitive Profile:</h4>
            <p>{analysis.cognitiveProfile}</p>
          </div>
          
          <div className="therapist-summary-section">
            <h4>Strengths:</h4>
            <div className="therapist-tags-container">
              {child.strengths.map((strength, index) => (
                <span key={index} className="therapist-tag therapist-tag-strength">
                  {strength}
                </span>
              ))}
            </div>
          </div>
          
          <div className="therapist-summary-section">
            <h4>Areas for Development:</h4>
            <div className="therapist-tags-container">
              {child.challenges.map((challenge, index) => (
                <span key={index} className="therapist-tag therapist-tag-challenge">
                  {challenge}
                </span>
              ))}
            </div>
          </div>
          
          <div className="therapist-summary-section">
            <h4>Therapeutic Recommendations:</h4>
            <p>{analysis.recommendations}</p>
          </div>
          
          <div className="therapist-summary-metrics">
            <div className="therapist-metric-item">
              <p className="therapist-metric-label">Progress Trend</p>
              <span className={`therapist-metric-value ${getMetricClass(analysis.progressTrend, 'trend')}`}>
                {analysis.progressTrend}
              </span>
            </div>
            <div className="therapist-metric-item">
              <p className="therapist-metric-label">Support Level</p>
              <span className={`therapist-metric-value ${getMetricClass(analysis.riskLevel, 'risk')}`}>
                {analysis.riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Comments Section in Detailed View */}
        <CommentsSection childId={child.id} childName={child.name} />
      </div>
    );
  };

  // Comments Component
  const CommentsSection = ({ childId, childName }) => {
    const childComments = comments[childId] || [];
    
    // Add safety check and debugging
    console.log('💬 CommentsSection rendering for:', childId, childName, 'Comments:', childComments);
    
    if (!childId || !childName) {
      console.error('❌ CommentsSection: Missing childId or childName');
      return (
        <div className="therapist-glass-card therapist-comments-section">
          <div className="therapist-error-message">
            <p>Error: Unable to load comments for this child</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="therapist-glass-card therapist-comments-section">
        <div className="therapist-comments-header">
          <h3 className="therapist-comments-title">
            <MessageCircle size={20} />
            Therapist Notes - {childName}
          </h3>
          <span className="therapist-comments-count">
            {childComments.length} {childComments.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        {/* Add New Comment */}
        <div className="therapist-add-comment">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onFocus={(e) => {
              // Prevent scroll jumping when focusing textarea
              e.preventDefault();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              e.target.focus();
              window.scrollTo(0, scrollTop);
            }}
            onKeyDown={(e) => {
              // Prevent unwanted scroll behavior
              e.stopPropagation();
            }}
            placeholder="Add a therapeutic note or observation..."
            className="therapist-comment-input"
            rows={3}
          />
          <div className="therapist-comment-actions">
            <button 
              onClick={() => addComment(childId)}
              className="therapist-add-comment-btn"
              disabled={!newComment.trim()}
            >
              <Plus size={16} />
              Add Note
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="therapist-comments-list">
          {childComments.length === 0 ? (
            <div className="therapist-no-comments">
              <MessageCircle size={48} />
              <p>No therapeutic notes yet</p>
              <span>Add your first observation or progress note</span>
            </div>
          ) : (
            childComments.map((comment) => (
              <div key={comment.id} className="therapist-comment-item">
                <div className="therapist-comment-header">
                  <div className="therapist-comment-author">
                    <User size={16} />
                    <span>{comment.author}</span>
                    {comment.edited && <span className="therapist-edited-tag">(edited)</span>}
                  </div>
                  <div className="therapist-comment-date">
                    <Calendar size={14} />
                    <span>{comment.timestamp}</span>
                  </div>
                </div>
                
                {editingComment === comment.id ? (
                  <div className="therapist-edit-comment">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      onFocus={(e) => {
                        // Prevent scroll jumping when focusing textarea
                        e.preventDefault();
                        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                        e.target.focus();
                        window.scrollTo(0, scrollTop);
                      }}
                      onKeyDown={(e) => {
                        // Prevent unwanted scroll behavior
                        e.stopPropagation();
                      }}
                      className="therapist-comment-input"
                      rows={3}
                    />
                    <div className="therapist-comment-actions">
                      <button 
                        onClick={() => editComment(childId, comment.id)}
                        className="therapist-save-comment-btn"
                        disabled={!editCommentText.trim()}
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button 
                        onClick={cancelEditComment}
                        className="therapist-cancel-comment-btn"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="therapist-comment-content">
                    <p className="therapist-comment-text">{comment.text}</p>
                    <div className="therapist-comment-controls">
                      <button 
                        onClick={() => startEditComment(comment)}
                        className="therapist-edit-comment-btn"
                      >
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteComment(childId, comment.id)}
                        className="therapist-delete-comment-btn"
                      >
                        <X size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Comments management functions
  const addComment = (childId) => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      text: newComment.trim(),
      author: user?.fullName || 'Dr. Therapist',
      date: new Date().toISOString(),
      timestamp: new Date().toLocaleString()
    };
    
    setComments(prev => ({
      ...prev,
      [childId]: [...(prev[childId] || []), comment]
    }));
    
    setNewComment('');
    
    // In a real app, you would save to backend here
    console.log('💬 Added comment for child:', childId, comment);
  };

  const editComment = (childId, commentId) => {
    if (!editCommentText.trim()) return;
    
    setComments(prev => ({
      ...prev,
      [childId]: prev[childId].map(comment => 
        comment.id === commentId 
          ? { ...comment, text: editCommentText.trim(), edited: true }
          : comment
      )
    }));
    
    setEditingComment(null);
    setEditCommentText('');
    
    console.log('✏️ Edited comment:', commentId);
  };

  const deleteComment = (childId, commentId) => {
    setComments(prev => ({
      ...prev,
      [childId]: prev[childId].filter(comment => comment.id !== commentId)
    }));
    
    console.log('🗑️ Deleted comment:', commentId);
  };

  const startEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.text);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  // Load comments from localStorage on component mount
  useEffect(() => {
    const savedComments = localStorage.getItem('therapistComments');
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments));
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  }, []);

  // Save comments to localStorage whenever comments change
  useEffect(() => {
    localStorage.setItem('therapistComments', JSON.stringify(comments));
  }, [comments]);

  if (!user || user.userType !== 'therapist') {
    return (
      <div className="therapist-dashboard-container">
        <div className="therapist-main-content">
          <div className="therapist-error-message">
            <h2>Access Denied</h2>
            <p>This dashboard is only accessible to therapists.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="therapist-dashboard-container">
        <div className="therapist-main-content">
          <div className="therapist-loading">
            <Activity className="animate-spin" size={48} />
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="therapist-dashboard-container">
        <div className="therapist-main-content">
          <div className="therapist-error-message">
            <h2>Error Loading Dashboard</h2>
            <p>{error}</p>
            <button onClick={fetchChildrenData} className="therapist-retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedChild) {
    return (
      <div className="therapist-dashboard-container">
        <div className="therapist-main-content">
          <DetailedAnalysis child={selectedChild} onBack={() => setSelectedChild(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="therapist-dashboard-container">
      {/* Medical floating elements */}
      <div className="medical-float-1"></div>
      <div className="medical-float-2"></div>
      
      <div className="therapist-main-content">
        {(() => {
          console.log('🏥 TherapistDashboard rendering - showCommentsFor:', showCommentsFor);
          console.log('🏥 TherapistDashboard - childrenData length:', childrenData.length);
          return null; // This is just for debugging
        })()}        <div className="therapist-dashboard-header">
          <h1 className="therapist-dashboard-title">
            JoyVerse Therapy Dashboard
          </h1>
          <p className="therapist-dashboard-subtitle">
            Comprehensive cognitive assessment and progress tracking for children with learning differences
          </p>
          {(handleLogout || logout) && (
            <div className="therapist-header-actions">
              <span className="therapist-welcome-text">Welcome, Dr. {user?.fullName || 'Therapist'}</span>
              <button onClick={handleLogout || logout} className="therapist-logout-button">
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="therapist-stats-grid">
          <StatCard 
            title="Total Children"
            value={childrenData.length}
            icon={Users}
            trend={2}
            colorClass="therapist-icon-blue"
          />
          <StatCard 
            title="Average Progress"
            value={`${Math.round(childrenData.reduce((acc, child) => acc + child.overallProgress, 0) / (childrenData.length || 1))}%`}
            icon={TrendingUp}
            trend={8}
            colorClass="therapist-icon-green"
          />
          <StatCard 
            title="Active Sessions"
            value="24"
            icon={Activity}
            trend={12}
            colorClass="therapist-icon-purple"
          />
          <StatCard 
            title="Avg Improvement"
            value={`${Math.round(childrenData.reduce((acc, child) => {
              const games = Object.values(child.games);
              const avgImp = games.reduce((sum, game) => sum + game.improvement, 0) / games.length;
              return acc + avgImp;
            }, 0) / (childrenData.length || 1))}%`}
            icon={Award}
            trend={5}
            colorClass="therapist-icon-orange"
          />
        </div>        <div>
          <h2 className="therapist-section-header">Children Overview</h2>
          {childrenData.length === 0 ? (
            <div className="therapist-glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
                No Children Data Available
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '1.5rem' }}>
                There are currently no children registered in the system, or no children have started playing games yet.
              </p>
              <button 
                onClick={fetchChildrenData} 
                className="therapist-retry-button"
                style={{ margin: '0 auto' }}
              >
                Refresh Data
              </button>
            </div>
          ) : (
            <div className="therapist-children-grid">
              {childrenData.map((child) => (
                <ChildCard 
                  key={child.id} 
                  child={child} 
                  onClick={setSelectedChild}
                />
              ))}
            </div>
          )}

          {/* Expanded Comments Section */}
          {showCommentsFor && (
            <div className="therapist-expanded-comments">
              {(() => {
                console.log('🔍 Rendering expanded comments for:', showCommentsFor);
                const selectedChild = childrenData.find(c => c.id === showCommentsFor);
                console.log('🔍 Found child:', selectedChild);
                return (
                  <CommentsSection 
                    childId={showCommentsFor} 
                    childName={selectedChild?.name || 'Child'} 
                  />
                );
              })()}
            </div>
          )}
        </div>

        <div className="therapist-analytics-grid">
          <div className="therapist-glass-card therapist-chart-container">
            <h3 className="therapist-chart-title">Game Performance Comparison</h3>
            <div className="therapist-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={childrenData.map(child => ({
                  name: child.name.split(' ')[0],
                  Coordination: child.games['pacman']?.score || 0,
                  Language: child.games['missing-letter-pop']?.score || 0,
                  'Word Skills': child.games['missing-letter-pop']?.score || 0
                }))}>
                  <CartesianGrid strokeDasharray="3,3" stroke="#ffffff30" />
                  <XAxis dataKey="name" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="Coordination" fill="#feca57" />
                  <Bar dataKey="Language" fill="#82ca9d" />
                  <Bar dataKey="Math Skills" fill="#ff7c7c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="therapist-glass-card therapist-chart-container">
            <h3 className="therapist-chart-title">Support Level Distribution</h3>
            <div className="therapist-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low Support', value: childrenData.filter(c => generateAnalysis(c).riskLevel === 'Low Support').length },
                      { name: 'Moderate Support', value: childrenData.filter(c => generateAnalysis(c).riskLevel === 'Moderate Support').length },
                      { name: 'High Support Needed', value: childrenData.filter(c => generateAnalysis(c).riskLevel === 'High Support Needed').length }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#82ca9d" />
                    <Cell fill="#ffc658" />
                    <Cell fill="#ff7c7c" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="therapist-dashboard-footer">
          <p className="therapist-footer-text">
            Dashboard updates automatically • Click on any child for detailed analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;
