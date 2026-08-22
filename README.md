# GlobeTrotter

Plan a multi-city trip end to end: pick the cities, set the dates, fill the days with activities, and watch the budget update as you go.

## What it is

Planning a trip across several cities usually ends up split between a notes app and a spreadsheet — the plan in one place, the cost in another. GlobeTrotter keeps them together. Every city stop and every activity you add feeds a budget that is recalculated on the server, so the plan and what it costs are always the same thing.

The app runs entirely on your machine: a FastAPI backend, a PostgreSQL database and a React frontend. Cities and activities come from a local seeded catalogue, so nothing depends on an external service.

## Quick start

You need Python 3.11+, Node 18+ and PostgreSQL 14+ running locally.

**1. Database**

```bash
createdb globetrotter
```

**2. Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then set DATABASE_URL and SECRET_KEY
python -m app.seed            # loads the cities and activities catalogue
uvicorn app.main:app --reload --port 8000
```

The API is then on http://localhost:8000 — `GET /api/health` should return `{"status":"ok"}`.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI + SQLAlchemy | Quick to build, and Pydantic validates every request body for free |
| Database | PostgreSQL | Relational data with real constraints — trips, stops and activities are all related |
| Frontend | React + Vite | Fast dev loop and easy component reuse across the twelve screens |
| Styling | Tailwind CSS | One theme file, responsive by default |
| Charts | Recharts | Budget breakdown by category and by day |
| Auth | JWT + bcrypt | Stateless, no session store needed |

## Data model

| Table | Holds |
|---|---|
| `cities` | Seeded catalogue: country, region, cost index, popularity, average stay and meal cost per day |
| `activities` | Seeded per city: category, cost and duration |

Relationship: a city has many activities.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Service check |

## Folder structure

```
backend/
  app/
    main.py        FastAPI app and routers
    database.py    engine, session, base
    models.py      SQLAlchemy models
    seed.py        cities and activities catalogue
  requirements.txt
frontend/
  src/
    api/           axios client
    components/    navigation, layout and shared UI
    pages/         one file per screen
    theme.js       colours used outside Tailwind
```

## Team

| Name | Focus |
|---|---|
| Dharmjit Chauhan | Backend core — authentication, trips, stops |
| Sanjay Prajapati | Frontend core — pages, forms, theme |
| Surya Prajapati | Data catalogue, search, budget, itinerary view |
