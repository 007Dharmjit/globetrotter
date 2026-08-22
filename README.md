# GlobeTrotter

Plan a multi-city trip end to end: pick the cities, set the dates, fill the days with activities, and watch the budget update as you go.

![Dashboard](docs/dashboard.png)

|  |  |
|---|---|
| ![Itinerary builder](docs/builder.png) | ![Budget breakdown](docs/budget.png) |

## The problem

Planning a trip across several cities ends up split between a notes app and a spreadsheet — the plan in one place, the cost in another. Neither knows about the other, so the moment you add a night in Udaipur or swap a museum for a rafting trip, the budget is out of date.

GlobeTrotter keeps them together. A trip is a list of city stops with dates, each stop holds activities, and every one of those numbers feeds a budget the server recalculates on the spot. It runs entirely on your own machine against a local database.

## Features

**Login and signup** — email and password with a JWT session. Passwords need a letter and a number, a duplicate email is refused, and a wrong login says only that the email or password is incorrect. Every trip belongs to the traveller who made it; opening someone else's answers 403.

**Forgot password** — ask for a reset from the login form and get a single-use link that lasts fifteen minutes. The app runs with no mail service, so the link is shown on screen and written to the server log instead of being emailed. An address with no account gets exactly the same wording, so the form gives nothing away.

**Dashboard** — a greeting, a running budget bar for your next trip, your three upcoming trips with dates and cost, and the most popular cities from the catalogue.

**Create trip** — name, description, dates, an optional budget and an optional cover photo, checked as you type: at least three characters, an end date on or after the start, no start date in the past, at most sixty days.

**Cover photo** — drop a JPG or PNG of up to 2 MB on a trip. The browser checks the type and size, the server checks the bytes themselves, and the picture becomes the banner on the trip page and on its card. Trips without one get a plain themed panel. It can be swapped or removed from the edit form.

**My Trips** — every trip as a card with its dates, stop count and projected cost, and view, edit and delete actions. Deleting asks first.

**Explore cities** — search 47 cities by name or country, filter by region, sort by popularity, name or price. Each card shows the average stay and meal cost per day and a cost level. **Add to trip** asks which trip and drops you in the builder with that city ready.

**Explore activities** — pick a city and narrow its activities by category, maximum cost and maximum hours.

**Saved destinations** — heart a city while exploring and it waits on your profile, ready to drop into a trip or remove.

**Itinerary builder** — add city stops with arrival and departure dates and what it cost to get there, reorder them, and hang activities off each stop with a day and a start time. A stop must sit inside the trip and cannot overlap another; an activity can only go on a day you are in that city.

**Reorder activities** — inside a stop, drag an activity by its handle to move it, with the keyboard or a mouse, or use the arrows on a touch screen. The order is stored and the itinerary and budget read it back.

**Itinerary view** — the trip read back day by day, grouped into city sections, each activity with its time, category, length and cost, and free days called out. A calendar toggle lays the same trip over a month grid where picking a day expands it.

**Budget** — worked out on the server: totals, the split between travel, stay, meals and activities, the cost of every day with days over your daily limit in red, and a table per city.

**Share** — turn a trip into a link anyone can open without an account. They see the plan only, on a page with no way into the app, and sharing can be switched off again.

**Copy a shared trip** — anyone with an account can take a shared itinerary as their own. Every stop and activity comes across, the dates shift so the copy starts tomorrow, and it lands in the builder ready to change. A signed-out visitor is asked to log in and comes straight back to the same page.

**Send it on** — WhatsApp, X and email buttons sit beside the link, on the share panel and on the shared page itself, each carrying the trip name.

**Profile** — change your name and interface language, set a profile photo, or delete your account and everything in it. The photo saves the moment it is picked and follows you into the navigation bar; without one you get your initials.

**Analytics** — administrators get a dashboard: totals, trips created over the last fortnight, the most visited cities, the most planned activities and the newest travellers.

**User management** — from that same table an administrator can deactivate a traveller, which keeps their data but tells them plainly at the login and closes any session they still have open, reactivate them again, or delete the account and everything in it after a confirmation. Nobody can deactivate or delete their own account.

## The thirteen screens

The brief lists thirteen screens. All thirteen are built; three carry a note where we made a deliberate call.

| # | Screen | Where it lives | State |
|---|---|---|---|
| 1 | Login / Signup | `/login`, `/signup`, `/forgot`, `/reset/:token` | Email and password, signup link, forgot password, validation on both sides |
| 2 | Dashboard | `/` | Welcome, upcoming trips, popular cities, *Plan new trip*, budget highlight |
| 3 | Create Trip | `/trips/new` | Name, dates, description, optional budget, optional cover photo |
| 4 | My Trips | `/trips` | Cards with name, date range, stop count, cost, and view / edit / delete |
| 5 | Itinerary Builder | `/trips/:id/build` | Add stops with city and dates, hang activities off them, reorder both |
| 6 | Itinerary View | `/trips/:id` | Day-wise layout, city headers, activity blocks with time and cost, list / calendar toggle |
| 7 | City Search | `/explore/cities` | Search, country and region filters, cost index and popularity, *Add to trip* |
| 8 | Activity Search | `/explore/activities` | Filters by category, cost and duration, with descriptions — see note |
| 9 | Budget & Cost Breakdown | `/trips/:id/budget` | Transport, stay, activities and meals; pie and per-day bars; average per day; over-budget days in red |
| 10 | Calendar / Timeline | Calendar toggle on `/trips/:id` | Month grid with expandable days; reordering and editing happen in the builder — see note |
| 11 | Shared / Public Itinerary | `/share/:token` | Public URL, read-only summary, *Copy trip*, WhatsApp / X / email buttons |
| 12 | Profile / Settings | `/profile` | Name, profile photo, language, saved destinations, delete account — see note |
| 13 | Admin / Analytics | `/admin` | Totals, trips per day, top cities and activities, and the traveller table with deactivate, reactivate and delete |

Three notes, so the table above is not read as more than it says:

- **Screen 8 has no activity photographs.** The catalogue is seeded on your own machine and calls nothing on the internet, so there are no pictures to seed with. Each activity carries a description, a category chip, its cost and its length instead, and cities are told apart by a colour band per region.
- **Screen 10 is read-only.** The calendar shows the plan and expands a day; adding, editing and reordering all happen in the builder, where the dates and the stop are chosen together. Activities are reordered by dragging there.
- **Screen 12 does not let you edit your email.** It is what you log in with, so changing it would need a confirmation round-trip we have no mail service for. Name, photo and language are all editable, and the account can be deleted outright.

## Quick start

Needs Python 3.11+, Node 20.19+ (or 22.12+) and PostgreSQL 14+ running locally.

```bash
# 1. database
sudo -u postgres createuser --pwprompt globetrotter          # choose a password
sudo -u postgres createdb --owner globetrotter globetrotter

# 2. backend — from the repository root
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
# fill in the two values below, then:
python -m app.seed
uvicorn app.main:app --reload --port 8000

# 3. frontend — in a second terminal, from the repository root
cd frontend && npm install && npm run dev
```

`backend/.env` needs exactly two values:

```bash
DATABASE_URL=postgresql://globetrotter:YOUR_PASSWORD@localhost:5432/globetrotter
SECRET_KEY=  # python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Open http://localhost:5173 and log in as `demo@globetrotter.app` / `Demo@1234` — a finished sample trip is already there. The API answers on http://localhost:8000, where `/api/health` returns `{"status":"ok"}`.

<details>
<summary>Having trouble or using different ports?</summary>

**Prerequisites in detail.** Node 18 is not enough — the Vite 8 build refuses to start on it. On Debian and Ubuntu, `python3 -m venv` also needs the `python3-venv` package.

**Other ways to write `DATABASE_URL`.** The role-with-password form above works everywhere. To use your own account instead:

```bash
# Linux: PostgreSQL trusts your own account over the local socket
DATABASE_URL=postgresql://YOUR_USERNAME@/globetrotter?host=/var/run/postgresql

# macOS (Homebrew): the same trust, over TCP
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/globetrotter
```

**Two errors that mean the URL is wrong.** `password authentication failed for user "postgres"` is the shipped placeholder still in place — a stock install gives that account no password. `fe_sendauth: no password supplied` is the passwordless TCP form on Linux, where the socket form above is the one that works.

**Running on different ports.** The API defaults to 8000 and the UI to 5173. If either is taken, four settings have to agree — change all of them and restart both servers:

| To change | Do this |
|---|---|
| API port | `uvicorn app.main:app --reload --port 8001` |
| UI port | `npm run dev -- --port 5174` |
| Tell the UI where the API is | put `VITE_API_URL=http://localhost:8001/api` in `frontend/.env.local` |
| Let the API accept the UI | set `FRONTEND_ORIGIN=http://localhost:5174` in `backend/.env` |

`FRONTEND_ORIGIN` is also the address written into share links, so it has to match the UI you actually open in the browser.

**Re-running the seed is safe.** It updates the catalogue rather than duplicating it, and leaves your own trips alone.

</details>

## How to use (3 minutes)

1. **Log in** with the demo account above. The dashboard shows the sample trip, its running budget and popular cities.
2. **Create a trip** — press *Plan new trip*, give it a name, dates about a month out and a budget of 35,000. Add a cover photo if you have a JPG or PNG to hand. Try an end date before the start date, or a date in the past, to see the checks.
3. **Add cities** — go to *Explore*, search for a city and press *Add to trip*. You land in the builder with that city selected; set the arrival and departure dates. Add a second city after it, and try overlapping dates to see the clash explained.
4. **Add activities** — press *Add activity* on a stop, pick something from that city and give it a day and a time. Picking a day you are not in that city is refused.
5. **Reorder** — use the arrows on a stop to move it up or down, and drag an activity by its handle to change the order inside a stop.
6. **Read the itinerary** — open the *Overview* tab for the day-by-day plan grouped by city, then switch to *Calendar* for the month grid.
7. **Check the budget** — open the *Budget* tab to see the split and the cost of each day. Go back to the builder, add an expensive activity such as *Hot air balloon over Amer* on the Jaipur stop, and return: that day turns red and the over-budget warning appears at the top.
8. **Share it** — press *Share* on the overview, copy the link from the box that appears, and open it in a private window. The trip is readable with no account.
9. **Copy it** — press *Copy trip* on that shared page. Signed out you are asked to log in and land back on the page; signed in the whole itinerary is copied into your own trips, starting tomorrow.
10. **Forget your password** — log out, press *Forgot password?* on the login form and enter the demo address. There is no mail service on a local machine, so the reset link appears on the page; open it and set a new password. (Set it back to `Demo@1234`, or re-run `python -m app.seed`, which restores it.)
11. **Resize the window** to phone width — the navigation collapses into a menu and every screen stacks.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI + SQLAlchemy | Quick to build, and Pydantic validates every request body for free |
| Database | PostgreSQL | Real relations and constraints between trips, stops, activities and cities |
| Frontend | React + Vite | Fast dev loop and component reuse across the twelve screens |
| Styling | Tailwind CSS | One theme file, responsive by default |
| Charts | Recharts | The budget split and the per-day bars |
| Drag and drop | dnd-kit | Reordering activities inside a stop, with keyboard dragging for free |
| Icons | lucide-react | One icon set, one weight |
| Auth | JWT + bcrypt | Stateless, no session store to run |

Nothing calls out to the internet: the city and activity catalogue is seeded locally, so the whole app works offline.

## Data model

| Table | Holds |
|---|---|
| `users` | Name, email, password hash, interface language, profile photo, administrator flag, active flag |
| `password_resets` | A single-use reset token for one user, with its expiry and whether it has been spent |
| `trips` | Name, description, date range, optional budget, cover photo, share token |
| `stops` | A city inside a trip: order, arrival and departure dates, travel cost, optional stay cost |
| `stop_activities` | An activity planned inside a stop: position, day, optional start time, optional cost override, note |
| `saved_cities` | A city one traveller has hearted, once each |
| `cities` | Seeded: country, region, cost index, popularity, average stay and meal cost per day |
| `activities` | Seeded per city: category, cost, duration |

A user has many trips; a trip has many ordered stops; a stop has many ordered activities; a city has many activities. Deleting a trip takes its stops and their activities with it, and deleting a user takes their trips, saved cities and reset tokens.

Columns added after the first release are applied on start-up, guarded so an existing database keeps its rows: `users.avatar`, `users.is_admin`, `users.is_active`, `trips.cover_image` and `stop_activities.order_index`, the last filled from the order the activities were already shown in. Uploaded pictures live on disk in `backend/uploads/` and are served from `/uploads`; the database only stores the path.

## API

All endpoints sit under `/api` and answer JSON. Everything except signup, login and the public share link needs a bearer token. `GET /api/health` is the service check.

- **Auth** — `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/forgot`, `POST /api/auth/reset`
- **Users** — `GET/PUT/DELETE /api/users/me`, `POST/DELETE /api/users/me/avatar`, `GET /api/users/languages`, `GET/POST /api/users/me/saved-cities`, `DELETE /api/users/me/saved-cities/{city_id}`
- **Trips** — `GET/POST /api/trips`, `GET/PUT/DELETE /api/trips/{id}`, `POST/DELETE /api/trips/{id}/cover`, `GET /api/trips/{id}/budget`
- **Stops and activities** — `POST /api/trips/{id}/stops`, `PUT/DELETE /api/stops/{id}`, `PUT /api/trips/{id}/stops/reorder`, `POST /api/stops/{id}/activities`, `PUT /api/stops/{id}/activities/reorder`, `DELETE /api/stop-activities/{id}`
- **Catalogue** — `GET /api/cities`, `GET /api/cities/popular`, `GET /api/cities/regions`, `GET /api/activities`, `GET /api/activities/categories`
- **Share** — `POST/DELETE /api/trips/{id}/share`, `GET /api/share/{token}`, `POST /api/share/{token}/copy`
- **Administration** — `GET /api/admin/stats`, `PATCH/DELETE /api/admin/users/{id}`

The two upload endpoints take `multipart/form-data` with one `file` field; everything else is JSON.

<details>
<summary>Full endpoint reference</summary>

**Auth and profile**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account, returns a token |
| POST | `/api/auth/login` | Log in, returns a token |
| POST | `/api/auth/forgot` | Start a password reset; answers the same whether or not the email is registered |
| POST | `/api/auth/reset` | Set a new password from a reset token |
| GET | `/api/users/me` | The signed-in traveller |
| PUT | `/api/users/me` | Change name and language |
| DELETE | `/api/users/me` | Delete the account and everything in it |
| POST | `/api/users/me/avatar` | Upload a profile photo (JPG or PNG, 2 MB) |
| DELETE | `/api/users/me/avatar` | Remove the profile photo |
| GET | `/api/users/languages` | Languages offered |
| GET | `/api/users/me/saved-cities` | Cities this traveller hearted |
| POST | `/api/users/me/saved-cities` | Save a city |
| DELETE | `/api/users/me/saved-cities/{city_id}` | Unsave a city |

**Trips**

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/trips` | Your trips with stop count and projected cost |
| POST | `/api/trips` | Create a trip |
| GET | `/api/trips/{id}` | One trip with its stops and their activities |
| PUT | `/api/trips/{id}` | Update a trip |
| DELETE | `/api/trips/{id}` | Delete a trip |
| POST | `/api/trips/{id}/cover` | Upload a cover photo (JPG or PNG, 2 MB) |
| DELETE | `/api/trips/{id}/cover` | Remove the cover photo |
| GET | `/api/trips/{id}/budget` | Cost breakdown by category, stop and day |

**Stops and activities**

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/trips/{id}/stops` | Add a city stop |
| PUT | `/api/stops/{id}` | Change a stop |
| DELETE | `/api/stops/{id}` | Remove a stop and close the gap in the order |
| PUT | `/api/trips/{id}/stops/reorder` | Set the order of the stops |
| POST | `/api/stops/{id}/activities` | Plan an activity inside a stop |
| PUT | `/api/stops/{id}/activities/reorder` | Set the order of the activities in a stop |
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
| POST | `/api/share/{token}/copy` | Copy a shared trip into your own, starting tomorrow |
| GET | `/api/admin/stats` | Totals, trips per day, top cities and activities, newest travellers |
| PATCH | `/api/admin/users/{id}` | Deactivate or reactivate a traveller |
| DELETE | `/api/admin/users/{id}` | Delete a traveller and everything they planned |
| GET | `/api/health` | Service check |

</details>

## Folder structure

```
backend/
  app/               FastAPI app, models, schemas, auth, uploads, budget maths, routers, seed script
  uploads/           cover photos and profile photos, served from /uploads (not in the repository)
  requirements.txt
frontend/
  src/               axios client, components, auth context, one page per screen, helpers
  package.json
  vite.config.js
```

## Team

| Name | Built |
|---|---|
| Dharmjit Chauhan | Backend core: database setup, authentication, password reset, trips, stops and planned activities, sharing, profile endpoints, administration and user management |
| Sanjay Prajapati | Frontend core: theme and navigation, login and signup, trip form and cards, cover photos, itinerary builder and activity dragging, share and profile screens |
| Surya Prajapati | City and activity catalogue and search, itinerary and calendar views, budget breakdown and charts, saved destinations, profile photos, copying a shared trip |
