import React, { useState, useRef, useEffect } from 'react';
import { X, Palette, Eraser, Download, RotateCcw, Circle, Square, Minus, Plus } from 'lucide-react';
import './artstudio.css';
import gameScoreService from '../../../services/gameScoreAPI';

const ArtStudio = ({ onClose, user }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#FF6B6B');
  const [brushSize, setBrushSize] = useState(5);  const [tool, setTool] = useState('brush'); // brush, eraser, circle, rectangle, line
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [toolsUsed, setToolsUsed] = useState(new Set(['brush']));
  const [colorsUsed, setColorsUsed] = useState(new Set([currentColor]));
  const [stickersAdded, setStickersAdded] = useState(0);
  const [artworkSaved, setArtworkSaved] = useState(false);
  
  // Default colors for kids
  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set background to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set initial drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Cleanup when component unmounts
    return () => {
      console.log('🧹 Cleaning up Art Studio');
    };
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    
    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };  const downloadArt = async () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${user?.childName || 'My'}_Artwork_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    setArtworkSaved(true);
    
    // Save art session score
    await saveArtScore();
  };

  // Save art session score
  const saveArtScore = async () => {
    try {
      const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
      const gameData = {
        timeSpent,
        toolsUsed: Array.from(toolsUsed),
        colorsUsed: Array.from(colorsUsed),
        stickersAdded,
        artworkSaved
      };
      
      const formattedData = gameScoreService.formatGameData('art-studio', gameData);
      await gameScoreService.saveGameScore(formattedData);
      console.log('Art session saved successfully');
    } catch (error) {
      console.error('Failed to save art session:', error);
    }
  };

  // Save score when closing if session was long enough
  const handleClose = async () => {
    const timeSpent = Math.round((Date.now() - sessionStartTime) / 1000);
    if (timeSpent > 30) { // Only save if they spent more than 30 seconds
      await saveArtScore();
    }
    onClose();
  };
  const addSticker = (emoji) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Add emoji sticker at random position
    const x = Math.random() * (canvas.width - 100) + 50;
    const y = Math.random() * (canvas.height - 100) + 50;
    
    ctx.font = '48px Arial';
    ctx.fillText(emoji, x, y);
    
    setStickersAdded(prev => prev + 1);
  };

  const stickers = ['🌟', '🦋', '🌈', '🌸', '🎈', '🦄', '🌞', '🐱', '🐶', '🦊', '🐸', '🐧', '🦜', '🌺', '🍀', '⭐'];

  return (
    <div className="art-studio-overlay" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>

      <div className="art-studio-container" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        color: '#333'
      }}>
        {/* Header */}
        <div className="art-studio-header" style={{
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          color: 'white'
        }}>
          <h2>🎨 Art Studio</h2>
          <p>Create amazing artwork, {user?.childName || 'Artist'}! 🌟</p>
          <button className="close-btn" onClick={handleClose} style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="art-studio-content">
          {/* Toolbar */}
          <div className="toolbar">
            {/* Tools */}
            <div className="tool-section">
              <h4>🛠️ Tools</h4>
              <div className="tool-buttons">                <button 
                  className={`tool-btn ${tool === 'brush' ? 'active' : ''}`}
                  onClick={() => {
                    setTool('brush');
                    setToolsUsed(prev => new Set([...prev, 'brush']));
                  }}
                  title="Brush"
                >
                  ✏️
                </button>
                <button 
                  className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                  onClick={() => {
                    setTool('eraser');
                    setToolsUsed(prev => new Set([...prev, 'eraser']));
                  }}
                  title="Eraser"
                >
                  <Eraser size={20} />
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="tool-section">
              <h4>🎨 Colors</h4>
              <div className="color-palette">                {defaultColors.map((color, index) => (
                  <button
                    key={index}
                    className={`color-btn ${currentColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setCurrentColor(color);
                      setColorsUsed(prev => new Set([...prev, color]));
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Brush Size */}
            <div className="tool-section">
              <h4>📏 Size</h4>
              <div className="size-controls">
                <button onClick={() => setBrushSize(Math.max(1, brushSize - 1))}>
                  <Minus size={16} />
                </button>
                <span className="size-display">{brushSize}</span>
                <button onClick={() => setBrushSize(Math.min(20, brushSize + 1))}>
                  <Plus size={16} />
                </button>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>

            {/* Stickers */}
            <div className="tool-section">
              <h4>✨ Stickers</h4>
              <div className="stickers-grid">
                {stickers.map((sticker, index) => (
                  <button
                    key={index}
                    className="sticker-btn"
                    onClick={() => addSticker(sticker)}
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="tool-section">
              <h4>🔧 Actions</h4>
              <div className="action-buttons">
                <button className="action-btn clear" onClick={clearCanvas}>
                  <RotateCcw size={16} />
                  Clear
                </button>
                <button className="action-btn download" onClick={downloadArt}>
                  <Download size={16} />
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="canvas-area">
            <canvas
              ref={canvasRef}
              className="drawing-canvas"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
            <div className="canvas-info">
              <p>Current Tool: <strong>{tool === 'brush' ? '✏️ Brush' : '🧽 Eraser'}</strong></p>
              <p>Color: <span style={{ color: currentColor, fontWeight: 'bold' }}>●</span></p>
              <p>Size: <strong>{brushSize}px</strong></p>
            </div>
          </div>
        </div>

        {/* Fun Encouragement */}
        <div className="encouragement" style={{
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          color: 'white'
        }}>
          <p>🌟 You're such a talented artist! Keep creating amazing things! 🎨</p>
        </div>
      </div>
    </div>
  );
};

export default ArtStudio;
