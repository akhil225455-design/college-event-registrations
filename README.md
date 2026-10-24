# CampusConnect Events

A college event registration website built with the MERN stack (MongoDB, Express, React, Node.js).
Students browse events and register for them. Organisers (admins) create events and see who signed up.

> **Live site:** _add your hosted URL here_
> **Repository:** _add your GitHub URL here_

---

## 1. Project definition

### Problem statement
Event registrations in the college are collected through scattered forms and chat groups, so organisers cannot tell how many seats are left or who has actually registered.

### Target users
| Role | What they can do |
| --- | --- |
| Visitor (not logged in) | Browse and search events, read event details. |
| Student | Everything a visitor can, plus register for an event, cancel a registration, and see their own registrations. |
| Admin (organiser) | Create, edit and delete events, see the registration list for each event, and download it as CSV. |

### MVP scope
**Must have**
- Student sign-up and login (JWT), admin login
- Event list with search, category filter and pagination
- Event detail page with live seat count
- Register and cancel, with capacity limit and no duplicate registrations
- "My registrations" page for students
- Admin event management and per-event registration list

**Later**
- Email confirmations, QR-code check-in, waiting list, event images, password reset, event reminders

### User stories and acceptance criteria
| Story | Acceptance criteria |
| --- | --- |
| As a student, I want to register for an event so that I get a seat. | A logged-in student can register while registration is open and seats remain. A full event shows "Full" and cannot be registered for. Registering twice returns a clear message. The seat count updates without a manual refresh. |
| As a student, I want to cancel my registration so that my seat goes to someone else. | Cancelling frees the seat immediately. Cancelling after the event has started is blocked with a message. |
| As a student, I want to see my registrations so that I remember what I signed up for. | Only my own registrations are listed. An empty list shows a friendly message with a link to browse events. |
| As an admin, I want to create events so that students can register. | Empty or invalid fields show a clear message and nothing is saved. The registration deadline cannot be after the event date. Capacity cannot be set below the number already registered. |
| As an admin, I want to see who registered so that I can plan the event. | The list shows name, email, department, roll number and time. It can be downloaded as CSV. Students cannot open this page. |

### Non-functional needs
- Passwords hashed with bcrypt (cost 12); secrets only in environment variables
- Server-side validation of every input; central error handler that never leaks stack traces
- Responsive from 375px wide; keyboard-friendly; text contrast meets WCAG AA; works in light and dark mode
- Every screen has loading, empty and error states

---

## 2. Architecture

```
React (Vite)  --HTTP/JSON-->  Express API (Node)  --Mongoose-->  MongoDB
client/                        server/
```

React never talks to MongoDB directly. Every call goes through `client/src/services/api.js` to the Express API.

### Folder structure
```
event-registration/
  client/                    React app
    src/
      components/            reusable UI (Navbar, EventRow, States, Pagination, ...)
      pages/                 route-level screens
      services/api.js        the only place that calls the backend
      context/AuthContext    logged-in user state
      hooks/useFetch.js      loading / error / data handling
  server/                    Express API
    src/
      routes/                URL + method mapping only
      controllers/           request handling logic
      models/                Mongoose schemas
      middleware/            auth, validation, error handling
      validators/            express-validator rules
      config/                environment + database setup
      seed.js                creates the first admin and sample events
```

### Data model
| Collection | Fields | Notes |
| --- | --- | --- |
| `users` | name, email (unique), passwordHash, role (`student`/`admin`), department, rollNumber, timestamps | `passwordHash` is never returned by the API. |
| `events` | title, description, category, venue, date, registrationDeadline, capacity, registeredCount, createdBy (ref User), timestamps | `registeredCount` changes only through atomic updates. Index on `date`. |
| `registrations` | user (ref User), event (ref Event), timestamps | Unique compound index on `(user, event)`. |

Registrations are a separate collection (referenced, not embedded) because they grow without limit and are queried from both sides: by student and by event.

### API contract
All paths start with `/api`. Errors always look like `{ "message": "..." }`.

| Method and path | Who | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| POST `/auth/register` | public | Create a student account | 201 `{ token, user }` | 400 invalid input, 409 email exists |
| POST `/auth/login` | public | Log in | 200 `{ token, user }` | 400, 401 wrong email or password |
| GET `/auth/me` | logged in | Current user | 200 `{ user }` | 401 |
| GET `/events` | public | List events. Query: `page`, `limit` (max 50), `search`, `category`, `upcoming` | 200 `{ data, page, limit, total, totalPages }` | 400 invalid query |
| GET `/events/:id` | public | One event | 200 `{ data }` | 400 bad id, 404 |
| POST `/events` | admin | Create event | 201 `{ data }` | 400, 401, 403 |
| PUT `/events/:id` | admin | Update event | 200 `{ data }` | 400, 401, 403, 404 |
| DELETE `/events/:id` | admin | Delete event and its registrations | 204 | 401, 403, 404 |
| GET `/events/:id/registrations` | admin | Who registered | 200 `{ event, data }` | 401, 403, 404 |
| POST `/events/:id/register` | student | Register | 201 `{ message, data }` | 400 closed or ended, 401, 403, 404, 409 full or already registered |
| DELETE `/events/:id/register` | student | Cancel registration | 200 `{ message, data }` | 400 event started, 401, 403, 404 |
| GET `/registrations/me` | student | My registrations | 200 `{ data }` | 401, 403 |
| GET `/health` | public | Health check | 200 `{ status: "ok" }` | |

---

## 3. Run it locally in VS Code

### Prerequisites
- Node.js 18 or newer (`node -v`), npm, Git
- A MongoDB database: either a free **MongoDB Atlas** cluster, or MongoDB Community Server running locally
- VS Code with the recommended extensions (VS Code will offer them when you open the folder: MongoDB for VS Code, Thunder Client, ESLint)

### Steps
1. Open the `event-registration` folder in VS Code (**File > Open Folder**) and open two terminals (**Terminal > New Terminal**, then the split icon).

2. **Terminal 1: API**
   ```bash
   cd server
   npm install
   cp .env.example .env        # on Windows PowerShell: copy .env.example .env
   ```
   Open `server/.env` and fill in:
   - `MONGODB_URI`: your Atlas connection string (or `mongodb://127.0.0.1:27017/college-events` for a local database)
   - `JWT_SECRET`: generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: the admin account you will log in with (password at least 8 characters)

   Then create the admin account and sample events, and start the API:
   ```bash
   npm run seed
   npm run dev
   ```
   You should see `MongoDB connected` and `API listening on port 5000`.

3. **Terminal 2: React app**
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```
   Open http://localhost:5173.

4. Try it: sign up as a student, register for an event, then log out and log in with the admin account to see the registration list.

### Atlas tips
- Create a database user with read/write access to one database only, not the admin user.
- Under **Network Access**, add your current IP address (or `0.0.0.0/0` only for testing, never for a real deployment).
- If your password has special characters such as `@` or `#`, URL-encode them in the connection string.

---

## 4. Testing

Use Thunder Client (VS Code) or Postman for the API, and the browser for the UI. Record results in the table below as you test.

| # | Test | Expected | Result |
| --- | --- | --- | --- |
| 1 | POST `/auth/register` with valid data | 201 and a token | |
| 2 | Same request again | 409 "email already exists" | |
| 3 | Register with a 5-character password | 400 with a message | |
| 4 | Login with the wrong password | 401 "Invalid email or password" | |
| 5 | POST `/events` with no token | 401 | |
| 6 | POST `/events` with a student token | 403 | |
| 7 | POST `/events` as admin with deadline after the event date | 400 | |
| 8 | GET `/events?search[$ne]=x` | 400 (injection blocked) | |
| 9 | Student registers, then registers again | 201, then 409 | |
| 10 | Register for an event with capacity 1 using two students | Second gets 409 "full" | |
| 11 | Student cancels | 200 and the seat count goes down by one | |
| 12 | Student calls GET `/events/:id/registrations` | 403 | |
| 13 | Admin sets capacity below the registered count | 400 | |
| 14 | UI: stop the API and reload the home page | Error message with a Try again button | |
| 15 | UI: search for text that matches nothing | "No events match your search" | |
| 16 | UI: 375px wide screen, keyboard only | Everything reachable and readable | |

---

## 5. Deployment (outline)

Deploying means making three parts work together: the database, the API and the frontend. Check each provider's **current** limits and pricing first, because free tiers change.

1. **Database:** MongoDB Atlas. Dedicated database user with minimum permissions; restrict network access.
2. **API (`server/`):** a host that runs a long-lived Node server (for example Render or Railway). Build command `npm install`, start command `npm start`. Set the environment variables `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (your live frontend URL, no trailing slash) and `NODE_ENV=production` in the host's dashboard. Free instances may sleep, so the first request can be slow.
3. **Frontend (`client/`):** a static host such as Netlify or Vercel. Build command `npm run build`, output folder `dist`. Set `VITE_API_URL` to your live API URL ending in `/api` **before** building. The SPA fallback is already included (`public/_redirects` for Netlify, `vercel.json` for Vercel) so refreshing `/admin` does not give a 404.
4. Run `npm run seed` once against the production database to create the admin (set `ADMIN_EMAIL` and `ADMIN_PASSWORD` temporarily), then remove those two variables.

### Post-deployment check
- Site loads over HTTPS with no console errors
- Sign-up, login, register and cancel work on the live URL
- Refreshing a deep link such as `/events/<id>` works
- No request still points at `localhost`
- No secret appears in the browser (Network tab) or in the repository

---

## 6. Security notes

- Passwords are hashed with bcrypt; the hash is never returned (`select: false` and removed in `toJSON`).
- Public sign-up can only create students. Admin accounts are created with the seed script.
- Every endpoint validates its input with express-validator. Text fields must be strings, which blocks NoSQL operator injection such as `{"$ne": ""}`.
- Role and ownership checks happen on the server. A student can only ever read or cancel their own registrations.
- Seat reservation uses a single atomic database update, so two students cannot take the last seat together. A unique index prevents duplicate registrations.
- Helmet sets safe headers, CORS allows only `CLIENT_ORIGIN`, and login/sign-up are rate limited (20 attempts per 15 minutes per IP).
- The JWT is kept in `localStorage`. This is simple but readable by any script on the page, so the app never renders untrusted HTML, and tokens expire after 7 days. An httpOnly cookie is the stronger alternative if you extend the project.
- Run `npm audit` in both folders before submitting.

## 7. Known limitations and future improvements

- No email confirmation or password reset
- Cancelling deletes the registration record (no history)
- The token is stored in `localStorage` (see above)
- No automated tests yet; testing is manual (section 4)
- Event images and QR check-in are not implemented

## 8. Screenshots

_Add screenshots of the event list, event detail, admin dashboard and a 375px mobile view here before submitting._
