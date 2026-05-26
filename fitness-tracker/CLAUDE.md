# PeakForm — AI Performance Tracker

Full-stack fitness and performance optimization app with:
- AI-powered peak window prediction (mental + physical)
- Comprehensive biometric tracking
- Progressive overload workout logging
- All data in a single SQLite database

## Quick Start

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
bash start.sh
```

Open http://localhost:3000

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite (port 8000)
- **Frontend**: React + TypeScript + Tailwind + Recharts (port 3000)
- **AI**: Claude API (claude-opus-4-7) for body state analysis and workout plans

## Key Files

```
fitness-tracker/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── models.py            # All SQLAlchemy database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── peak_calculator.py   # Peak window algorithm (circadian + HRV + stimulants)
│   ├── ai_engine.py         # Claude API integration
│   ├── database.py          # SQLite setup
│   └── routers/             # API endpoints per domain
├── frontend/
│   └── src/components/      # React components
├── .env                     # API keys (gitignored)
└── start.sh                 # One-command startup
```

## Database

All data is stored in `backend/fitness_tracker.db` (SQLite). Tables:
- `users` — profile, chronotype, baselines
- `sleep_logs` — duration, quality, deep/REM, HRV
- `workout_sessions` + `exercise_sets` — training data
- `exercises` — exercise library
- `nutrition_logs` + `water_logs` — macros and hydration
- `supplement_logs` + `stimulant_logs` — supplements and stimulants
- `heart_logs` — HR, HRV, SpO2, VO2max
- `recovery_logs` — soreness, energy, stress, mood
- `goals` — progress tracking

## Peak Window Algorithm

Located in `backend/peak_calculator.py`. Computes hourly 0-100 scores for:
- **Mental performance**: 2-process circadian model + sleep quality + HRV + caffeine pharmacokinetics
- **Physical performance**: circadian model + recovery score + HRV + muscle soreness
- **Readiness score**: weighted combination of sleep, HRV vs baseline, recovery metrics

Key adjustments:
- Chronotype shifts the entire curve (morning owl = earlier peaks, night owl = later)
- Caffeine modeled as bell curve peaking 90min after intake, decaying via half-life
- Sleep debt suppresses both mental and physical scores
- HRV below baseline reduces both curves

## API Endpoints

- `GET /api/dashboard` — all data for today
- `POST /api/ai/analyze` — Claude full body analysis
- `POST /api/ai/workout-plan` — AI workout recommendation
- `GET /docs` — Swagger UI for all endpoints

## Development

```bash
# Backend only
cd backend && source .venv/bin/activate && uvicorn main:app --reload

# Frontend only
cd frontend && npm run dev
```
