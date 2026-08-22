# GlobeTrotter

Plan a multi-city trip end to end: pick the cities, set the dates, fill the days with activities, and watch the budget update as you go.

## The problem

Planning a trip across several cities usually ends up split between a notes app and a spreadsheet — the plan in one place, the cost in another. Neither knows about the other, so the moment you add a night in Udaipur or swap a museum for a rafting trip, the budget is out of date.

GlobeTrotter keeps them together. A trip is a list of city stops with dates; each stop holds activities; and every one of those numbers feeds a budget the server recalculates on the spot. The whole thing runs on your own machine against a local database.

## Features

**Sign up and log in** — email and password with a JWT session. Every trip belongs to the traveller who made it, and opening someone else's is refused.

**Dashboard** — a greeting, your next three upcoming trips with dates and running cost, and one button to start a new plan.

**Create trip** — name, description, dates and an optional budget, with the rules checked as you type: at least three characters, an end date on or after the start, no start date in the past, and at most sixty days.

**My Trips** — every trip as a card showing its dates, how many stops it has and what it is projected to cost, with view, edit and delete.

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
python -m app.seed            # loads cities, activities and the demo account
uvicorn app.main:app --reload --port 8000
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and log in with the demo account:

```
demo@globetrotter.app
Demo@1234
```

## How to use

1. Log in with the demo account above, or create your own from the signup link.
2. The dashboard shows your upcoming trips. Press **Plan new trip**.
3. Give the trip a name and a date range — try an end date before the start date to see the checks.
4. Open **My Trips** to see the trip card with its dates, stop count and planned cost.
5. Use **Edit** to rename or re-date the trip, or delete it from the same card.

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
| `users` | Name, email, password hash, language |
| `trips` | Name, description, date range, optional budget, share flag |
| `cities` | Seeded catalogue: country, region, cost index, popularity, average stay and meal cost per day |
| `activities` | Seeded per city: category, cost and duration |

Relationships: a user has many trips; a city has many activities.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account, returns a token |
| POST | `/api/auth/login` | Log in, returns a token |
| GET | `/api/users/me` | The signed-in traveller |
| GET | `/api/trips` | Trips belonging to the signed-in traveller |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/{id}` | One trip |
| PUT | `/api/trips/{id}` | Update a trip |
| DELETE | `/api/trips/{id}` | Delete a trip |
| GET | `/api/health` | Service check |

## Folder structure

```
backend/
  app/
    main.py        FastAPI app and routers
    database.py    engine, session, base
    models.py      SQLAlchemy models
    schemas.py     request and response validation
    auth.py        hashing, tokens, current user
    routers/       auth, users, trips
    seed.py        cities, activities and the demo account
  requirements.txt
frontend/
  src/
    api/           axios client
    components/    navigation, layout and shared UI
    context/       auth state
    pages/         one file per screen
    format.js      money and date formatting
    theme.js       colours used outside Tailwind
```

## Team

| Name | Focus |
|---|---|
| Dharmjit Chauhan | Backend core — authentication, trips, stops |
| Sanjay Prajapati | Frontend core — pages, forms, theme |
| Surya Prajapati | Data catalogue, search, budget, itinerary view |
