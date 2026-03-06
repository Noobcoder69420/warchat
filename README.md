# ⌨️ KEYBOARD WARRIOR

AI-judged trash talk tournament. Two players, real-time battles, Groq-powered scoring.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite → Vercel |
| Backend | Flask + Flask-SocketIO → Railway |
| Realtime | Socket.IO WebSockets |
| AI Judge | Groq (llama3-8b) — free tier |
| Fallback | Local heuristic judge |

---

## Local Dev Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env from example
cp .env.example .env
# Add your GROQ_API_KEY from https://console.groq.com

python app.py
# Runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Set VITE_BACKEND_URL=http://localhost:5000 for local dev

npm run dev
# Runs on http://localhost:3000
```

---

## Deploy

### Backend → Railway

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Point to `/backend` folder
3. Add environment variables:
   - `GROQ_API_KEY` = your Groq key
   - `SECRET_KEY` = any random string
4. Railway auto-detects `railway.toml` and runs gunicorn

### Frontend → Vercel

1. Go to https://vercel.com → New Project → Import GitHub repo
2. Set root directory to `frontend`
3. Add environment variable:
   - `VITE_BACKEND_URL` = your Railway URL (e.g. `https://keyboard-warrior.railway.app`)
4. Deploy

---

## Environment Variables

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes (for AI judge) | From console.groq.com — free tier |
| `SECRET_KEY` | Yes | Flask session secret |
| `PORT` | Auto (Railway) | Set automatically |

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BACKEND_URL` | Yes | Full URL to your Railway backend |

---

## How It Works

1. Player 1 creates a room → gets a 4-char code
2. Player 2 enters the code → joins
3. OR both players hit Matchmaking → auto-matched
4. Best of 5 rounds, 30 seconds each
5. Every message is scored by Groq (Aura + Damage + Creativity)
6. Power bar shifts in real time
7. Round/match winner determined by cumulative score

---

## AI Judge

Uses `llama3-8b-8192` on Groq. Scores each message:
- **Aura** (1–10): Confidence and delivery style
- **Damage** (1–10): Sting and impact of the insult  
- **Creativity** (1–10): Originality, wordplay, references
- **Total**: Sum (max 30)
- **Verdict**: 4–6 word hype callout

Falls back to heuristic judge if `GROQ_API_KEY` is not set.

---

## Project Structure

```
keyboard-warrior/
├── backend/
│   ├── app.py           # Flask + Socket.IO server
│   ├── rooms.py         # Room & matchmaking manager
│   ├── judge.py         # Groq AI + heuristic judge
│   ├── requirements.txt
│   ├── railway.toml
│   └── Procfile
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── socket.js        # Socket.IO singleton
    │   ├── context/
    │   │   └── GameContext.jsx  # Global state
    │   ├── pages/
    │   │   ├── Lobby.jsx
    │   │   └── Battle.jsx
    │   └── components/
    │       ├── PowerBar.jsx
    │       ├── FighterCard.jsx
    │       ├── RoundHUD.jsx
    │       ├── ChatArea.jsx
    │       ├── RoundOverlay.jsx
    │       └── MatchOverlay.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```
