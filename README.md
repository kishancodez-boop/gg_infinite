# GreenGrid India

**GreenGrid India** is an India-focused Renewable Energy Intelligence & Opportunity Platform designed to bring fragmented public renewable-energy data, policies, solar ROI tools, RPO insights, green finance, and green career opportunities into one trustworthy, source-attributed interface.

> **Current Status:** Milestones 00–08 Complete — Foundation, Eco-Tech Design System & Shell, Backend API & Models, Official Data Source Registry, REA Safe Data Ingestion Engine, Policies & Government Schemes Explorer, Solar ROI Calculator & Financial Simulator, and National Renewable Energy Dashboard.

---

## Folder Structure

```text
Infinite_loops/
├── client/                  # React + TypeScript + Vite + Tailwind CSS frontend
├── server/                  # Node.js + Express + TypeScript + Mongoose backend
├── docs/
│   └── progress-log.md      # Milestone progress log
├── .env.example             # Root environment variable reference
├── .gitignore               # Git ignore rules (excludes node_modules, .env, dist)
├── package.json             # Root helper scripts for client and server
├── memory.md                # Canonical product vision & design system
├── skill.md                 # Canonical engineering & REA rules
├── FINAL_MASTER_PROMPT.md   # Canonical project master instructions
└── HACKATHON_EXPLANATION_NOTES.md
```

---

## Prerequisites

- **Node.js** (v20 LTS or newer recommended) and **npm**
- **MongoDB** (optional for Milestone 01 — the API starts cleanly even without `MONGODB_URI` and accurately reports `unconfigured` or `disconnected`)

---

## Quick Start (Local Development)

### 1. Install Dependencies
From the project root (`Infinite_loops`):

```bash
npm run install:all
```

*(Or install separately inside `server/` and `client/` with `npm install`.)*

### 2. Configure Environment Variables (Optional for Milestone 01)
Copy the example environment files if you want custom ports or a MongoDB connection:

- Backend: copy `server/.env.example` to `server/.env`
- Frontend: copy `client/.env.example` to `client/.env`

**Do not commit `.env` files to Git.**

### 3. Start the Backend Server
Open a terminal in the project root and run:

```bash
npm run dev:server
```

The Express API starts on `http://localhost:5000`.
- Health check: `GET http://localhost:5000/api/health`
- Detailed status: `GET http://localhost:5000/api/v1/system/status`

### 4. Start the Frontend App
Open a **second** terminal in the project root and run:

```bash
npm run dev:client
```

Vite starts the React app on `http://localhost:5173` and automatically proxies `/api/*` requests to `http://localhost:5000`.

---

## MongoDB Setup Options (For Later Milestones or Testing Now)

You do **not** need MongoDB installed locally to run Milestone 01. When you are ready to connect a database:

1. **Option A — MongoDB Atlas (Cloud, easiest for hackathons):**
   - Create a free M0 cluster on MongoDB Atlas, create a database user, allow your IP (or `0.0.0.0/0` temporarily for hackathon testing), and copy the connection string into `server/.env` as `MONGODB_URI=...`.
2. **Option B — Local MongoDB Community / Docker:**
   - Run MongoDB locally on port `27017` and set `MONGODB_URI=mongodb://127.0.0.1:27017/greengrid_india` in `server/.env`.

---

## Verification Commands

From the project root:

```bash
npm run typecheck   # Type-checks both server and client
npm run build       # Builds TypeScript backend and production Vite frontend
npm test            # Runs Vitest + Supertest tests
```

For full API endpoint documentation, Mongoose models, and data provenance rules, see [docs/api-and-models.md](docs/api-and-models.md). To load explicitly labeled `[DEMO]` fixtures once `MONGODB_URI` is configured in development:

```bash
npm --prefix server run seed:demo
```

