# User Analytics Application

A small full-stack analytics application built for the CausalFunnel Full Stack Engineer assignment. It demonstrates how a website can collect page-view and click events, store them in MongoDB, and display sessions, user journeys, and click positions in a dashboard.

## Features

- A lightweight browser tracker (`tracker/tracker.js`) that records `page_view` and `click` events.
- A session ID stored in `localStorage`.
- Event payloads include session ID, event type, page URL, timestamp, and click coordinates for click events.
- Node.js + Express REST API.
- MongoDB persistence with a Mongoose event model.
- Dashboard with session counts, ordered event journeys, and a click-position heatmap.
- Demo page for generating sample events.

## Tech stack

- React + Vite
- Node.js + Express
- MongoDB Atlas / local MongoDB
- Mongoose
- Plain JavaScript tracking snippet

## Project structure

```text
user-analytics-app/
├── backend/
│   ├── models/Event.js
│   ├── routes/events.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/App.jsx
│   ├── src/main.jsx
│   ├── src/styles.css
│   ├── index.html
│   └── package.json
├── tracker/tracker.js
├── demo/index.html
├── .gitignore
└── README.md
```

## Requirements

- Node.js 18 or newer
- MongoDB Atlas connection string or a local MongoDB server

## Run locally

### 1. Start the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set `MONGODB_URI`. Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/user_analytics
CLIENT_ORIGIN=http://localhost:5173
```

For MongoDB Atlas, use your Atlas connection string instead of the local URI. Do not commit `.env`.

Start the API:

```bash
npm run dev
```

The API health endpoint is `http://localhost:5000/api/health`.

### 2. Start the dashboard

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

### 3. Generate events

Open `http://localhost:5000/demo` if the backend serves the demo, or serve `demo/index.html` using a local static server. The simplest approach is to open `demo/index.html` in a browser while the API is running; the demo sends events to `http://localhost:5000/api/events`.

Refresh the demo page and click its buttons. Then return to the dashboard and refresh the data.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | API health check |
| `POST` | `/api/events` | Validate and store an event |
| `GET` | `/api/sessions` | List sessions with total event counts and last activity |
| `GET` | `/api/sessions/:sessionId/events` | Fetch events for one session in timestamp order |
| `GET` | `/api/heatmap?url=<page-url>` | Fetch click coordinates for a page URL |

## Event schema

```json
{
  "session_id": "browser-generated-id",
  "event_type": "click",
  "page_url": "https://example.com/",
  "timestamp": "2026-10-13T12:00:00.000Z",
  "click_x": 120,
  "click_y": 240
}
```

`click_x` and `click_y` are viewport-relative coordinates from `clientX` and `clientY`. Page views omit click coordinates. The heatmap uses the same viewport-relative coordinate convention.

## Assumptions and trade-offs

- A session ID is created once per browser profile and retained in `localStorage`. This is a simple demo choice; a production analytics system would define session expiry and consent rules.
- Coordinates are viewport-relative, so the heatmap is most meaningful when the demo page is viewed at a similar viewport size.
- The dashboard polls the API when the user refreshes or selects a session; it does not use real-time streaming.
- The assignment is a learning/demo implementation, not a production analytics SDK. Production deployment should add rate limiting, stronger validation, privacy/consent controls, authentication for the dashboard, and monitoring.
- The backend requires MongoDB to be reachable before it can store events.

## Before submitting

1. Run the backend and frontend locally.
2. Generate several page views and clicks.
3. Confirm sessions, event timelines, and heatmap points work.
4. Add screenshots or a short demo video if useful.
5. Push source code to a **public** GitHub repository.
6. Never upload `.env` or database credentials.
