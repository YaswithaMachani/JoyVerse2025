# JoyVerse

A therapeutic gaming platform that combines mental health support with interactive games and real-time emotion detection.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)

## Overview

JoyVerse helps children engage with mental health therapy through games while providing therapists with valuable insights through emotion tracking and analytics.

## Features

**Games Available:**
- PacMan Quest
- Missing Letter Pop
- Space Math Adventure  
- Art Studio
- Music Fun
- Kitten Match

**For Therapists:**
- Real-time emotion monitoring during gameplay
- Client progress dashboards
- Session analytics and reports

**Technical:**
- Vision Transformer (ViT) model for emotion detection
- 5-class emotion classification (anger, happiness, neutral, sadness, surprise)
- Real-time facial analysis using MediaPipe

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** Node.js, Express, MongoDB
- **ML Service:** Python, FastAPI, PyTorch
- **Database:** MongoDB Atlas

## Quick Start

**Prerequisites:** Node.js 16+, Python 3.8+, MongoDB

1. **Clone and setup frontend:**
```bash
git clone https://github.com/RoshanMatthew2005/JoyVerse.git
cd JoyVerse/FrontEnd
npm install && npm run dev
```

2. **Setup backend:**
```bash
cd ../MiddleWare\(B\)
npm install
echo "MONGO_URI=your_mongodb_uri" > .env
echo "JWT_SECRET=your_secret" >> .env
npm run dev
```

3. **Setup ML service:**
```bash
cd ../Model
pip install -r requirements.txt
python main.py
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000  
- ML Service: http://localhost:8001

## Project Structure

```
JoyVerse/
├── FrontEnd/           # React app
│   ├── src/components/ # UI components
│   ├── src/pages/      # App pages
│   └── src/services/   # API calls
├── MiddleWare(B)/      # Express API
│   ├── src/controllers/
│   ├── src/models/
│   └── src/routes/
└── Model/              # Python ML service
    ├── models/         # Trained models
    └── vit_model.py    # ViT implementation
```

## Key API Endpoints

```
POST /api/auth/login              # User login
POST /api/auth/register/child     # Child registration
GET  /api/game-scores/user/:id    # User's game scores
POST /api/emotions                # Submit emotion data
GET  /api/emotions/trends         # Emotion analytics
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file.
