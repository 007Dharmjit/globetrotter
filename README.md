# GlobeTrotter

Plan a multi-city trip end to end: pick the cities, set the dates, fill the days with activities, and watch the budget update as you go.

![Dashboard](docs/dashboard.png)

![Itinerary builder](docs/builder.png)

![Budget breakdown](docs/budget.png)

## The problem

Planning a trip across several cities ends up split between a notes app and a spreadsheet — the plan in one place, the cost in another. Neither knows about the other, so the moment you add a night in Udaipur or swap a museum for a rafting trip, the budget is out of date.

GlobeTrotter keeps them together. A trip is a list of city stops with dates, each stop holds activities, and every one of those numbers feeds a budget the server recalculates on the spot. It runs entirely on your own machine against a local database.

## Features

**Login and signup** — email and password with a JWT session. Passwords need a letter and a number, a duplicate email is refused, and a wrong login says only that the email or password is incorrect. Every trip belongs to the traveller who made it; opening someone else's answers 403.

**Dashboard** — a greeting, a running budget bar for your next trip, your three upcoming trips with dates and cost, and the most popular cities from the catalogue.

**Create trip** — name, description, dates and an optional budget, checked as you type: at least three characters, an end date on or after the start, no start date in the past, at most sixty days.

**My Trips** — every trip as a card with its dates, stop count and projected cost, and view, edit and delete actions. Deleting asks first.

**Explore cities** — search 47 cities by name or country, filter by region, sort by popularity, name or price. Each card shows the average stay and meal cost per day and a cost level. **Add to trip** asks which trip and drops you in the builder with that city ready.

**Explore activities** — pick a city and narrow its activities by category, maximum cost and maximum hours.

**Itinerary builder** — add city stops with arrival and departure dates and what it cost to get there, reorder them, and hang activities off each stop with a day and a start time. A stop must sit inside the trip and cannot overlap another; an activity can only go on a day you are in that city.

**Itinerary view** — the trip read back day by day, grouped into city sections, each activity with its time, category, length and cost, and free days called out. A calendar toggle lays the same trip over a month grid where picking a day expands it.

**Budget** — worked out on the server: totals, the split between travel, stay, meals and activities, the cost of every day with days over your daily limit in red, and a table per city.

**Share** — turn a trip into a link anyone can open without an account. They see the plan only, on a page with no way into the app, and sharing can be switched off again.

**Profile** — change your name and interface language, or delete your account and everything in it.

## Quick start

You need **Python 3.11+**, **Node 20.19+ or 22.12+** and **PostgreSQL 14+** running locally. Node 18 is not enough — the Vite 8 build refuses to start on it. On Debian and Ubuntu, `python3 -m venv` also needs the `python3-venv` package.

**1. Database**

```bash
createdb globetrotter
```

If that answers `role "<your username>" does not exist`, give your account a PostgreSQL role first and try again:

```bash
sudo -u postgres createuser --createdb "$USER"
```

**2. Backend**

From the repository root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Now open `backend/.env` and set `DATABASE_URL` and `SECRET_KEY`.

`DATABASE_URL` must end in the database name you created above. Which form connects depends on how your PostgreSQL is set up — use the first one that works:

```bash
# Linux: PostgreSQL trusts your own account over the local socket
DATABASE_URL=postgresql://YOUR_USERNAME@/globetrotter?host=/var/run/postgresql

# macOS (Homebrew): the same trust, over TCP
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/globetrotter

# Anywhere, with a role that has a password
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/globetrotter
```

Two errors mean you picked the wrong one. `password authentication failed for user "postgres"` is the shipped placeholder still being used — a stock install gives that account no password. `fe_sendauth: no password supplied` is the TCP form on Linux, where the socket form above is the one that works.

`SECRET_KEY` is any long random string. Generate one with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

The other two keys already have working defaults: `ACCESS_TOKEN_EXPIRE_MINUTES` (how many minutes a login lasts) and `FRONTEND_ORIGIN` (where the UI runs — leave it unless you change the frontend port).

Then seed the catalogue and start the API:

```bash
python -m app.seed            # cities, activities and the demo account
uvicorn app.main:app --reload --port 8000
```

`GET http://localhost:8000/api/health` should answer `{"status":"ok"}`. Leave this terminal running.

**3. Frontend**

In a second terminal, again from the repository root:

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

**Running on different ports**

The API defaults to 8000 and the UI to 5173. If either port is taken, four settings have to agree — change all of them and restart both servers:

| To change | Do this |
|---|---|
| API port | `uvicorn app.main:app --reload --port 8001` |
| UI port | `npm run dev -- --port 5174` |
| Tell the UI where the API is | put `VITE_API_URL=http://localhost:8001/api` in `frontend/.env.local` |
| Let the API accept the UI | set `FRONTEND_ORIGIN=http://localhost:5174` in `backend/.env` |

`FRONTEND_ORIGIN` is also the address baked into generated share links, so it has to match the UI you actually open in the browser.

It comes with a finished sample trip, so nothing starts from an empty screen. Running the seed again is safe — it updates the catalogue rather than duplicating it, and leaves your own trips alone.

## How to use (3 minutes)

1. **Log in** with the demo account above. The dashboard shows the sample trip, its running budget and popular cities.
2. **Create a trip** — press *Plan new trip*, give it a name, dates about a month out and a budget of 35,000. Try an end date before the start date, or a date in the past, to see the checks.
3. **Add cities** — go to *Explore*, search for a city and press *Add to trip*. You land in the builder with that city selected; set the arrival and departure dates. Add a second city after it, and try overlapping dates to see the clash explained.
4. **Add activities** — press *Add activity* on a stop, pick something from that city and give it a day and a time. Picking a day you are not in that city is refused.
5. **Reorder** — use the arrows on a stop to move it up or down.
6. **Read the itinerary** — open the *Overview* tab for the day-by-day plan grouped by city, then switch to *Calendar* for the month grid.
7. **Check the budget** — open the *Budget* tab to see the split and the cost of each day. Go back to the builder, add an expensive activity such as *Hot air balloon over Amer* on the Jaipur stop, and return: that day turns red and the over-budget warning appears at the top.
8. **Share it** — press *Share* on the overview, copy the link from the box that appears, and open it in a private window. The trip is readable with no account.
9. **Resize the window** to phone width — the navigation collapses into a menu and every screen stacks.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI + SQLAlchemy | Quick to build, and Pydantic validates every request body for free |
| Database | PostgreSQL | Real relations and constraints between trips, stops, activities and cities |
| Frontend | React + Vite | Fast dev loop and component reuse across the twelve screens |
| Styling | Tailwind CSS | One theme file, responsive by default |
| Charts | Recharts | The budget split and the per-day bars |
| Icons | lucide-react | One icon set, one weight |
| Auth | JWT + bcrypt | Stateless, no session store to run |

Nothing calls out to the internet: the city and activity catalogue is seeded locally, so the whole app works offline.

## Data model

| Table | Holds |
|---|---|
| `users` | Name, email, password hash, interface language |
| `trips` | Name, description, date range, optional budget, share token |
| `stops` | A city inside a trip: order, arrival and departure dates, travel cost, optional stay cost |
| `stop_activities` | An activity planned inside a stop: day, optional start time, optional cost override, note |
| `cities` | Seeded: country, region, cost index, popularity, average stay and meal cost per day |
| `activities` | Seeded per city: category, cost, duration |

A user has many trips; a trip has many ordered stops; a stop has many planned activities; a city has many activities. Deleting a trip takes its stops and their activities with it.

## API

All endpoints sit under `/api` and answer JSON. Everything except signup, login and the public share link needs a bearer token.

**Auth and profile**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account, returns a token |
| POST | `/api/auth/login` | Log in, returns a token |
| GET | `/api/users/me` | The signed-in traveller |
| PUT | `/api/users/me` | Change name and language |
| DELETE | `/api/users/me` | Delete the account and everything in it |
| GET | `/api/users/languages` | Languages offered |

**Trips**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/trips` | Your trips with stop count and projected cost |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/{id}` | One trip with its stops and their activities |
| PUT | `/api/trips/{id}` | Update a trip |
| DELETE | `/api/trips/{id}` | Delete a trip |
| GET | `/api/trips/{id}/budget` | Cost breakdown by category, stop and day |

**Stops and activities**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/trips/{id}/stops` | Add a city stop |
| PUT | `/api/stops/{id}` | Change a stop |
| DELETE | `/api/stops/{id}` | Remove a stop and close the gap in the order |
| PUT | `/api/trips/{id}/stops/reorder` | Set the order of the stops |
| POST | `/api/stops/{id}/activities` | Plan an activity inside a stop |
| DELETE | `/api/stop-activities/{id}` | Take a planned activity off |

**Catalogue and sharing**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/cities` | Search by text, country or region; sort by popularity, name or cost |
| GET | `/api/cities/popular` | Most popular cities |
| GET | `/api/cities/regions` | Regions available for filtering |
| GET | `/api/activities` | Activities in one city, filtered by category, cost, duration |
| GET | `/api/activities/categories` | Activity categories |
| POST | `/api/trips/{id}/share` | Make a trip public and return its link |
| DELETE | `/api/trips/{id}/share` | Stop sharing |
| GET | `/api/share/{token}` | Read a shared trip, no account needed |
| GET | `/api/health` | Service check |

## Folder structure

```
backend/
  app/
    main.py        FastAPI app, CORS, routers
    database.py    engine, session, base
    models.py      SQLAlchemy models
    schemas.py     request and response validation
    auth.py        hashing, tokens, current user
    budget.py      cost maths for a trip
    routers/       auth, users, trips, stops, cities, activities, share
    seed.py        cities, activities, demo account and sample trip
  requirements.txt
frontend/
  src/
    api/           axios client with the token interceptor
    components/    navigation, layout, cards, modals, shared UI
    context/       auth state
    pages/         one file per screen
    format.js      money and date formatting
    theme.js       colours used outside Tailwind
    validation.js  shared field checks
```

## Team

| Name | Built |
|---|---|
| Dharmjit Chauhan | Backend core: database setup, authentication, trips, stops and planned activities, sharing, profile endpoints |
| Sanjay Prajapati | Frontend core: theme and navigation, login and signup, trip form and cards, itinerary builder, share and profile screens |
| Surya Prajapati | City and activity catalogue and search, itinerary and calendar views, budget breakdown and charts |
