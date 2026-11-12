# GreenGrid India — Manual Deployment Guide (Milestone 15)

This guide covers manual production deployment of **GreenGrid India** using **MongoDB Atlas** (database), **Render** (Express + TypeScript backend), and **Vercel** (React + Vite frontend).

> **Important:** Do not commit `.env` files, database passwords, or `ADMIN_API_KEY` to Git. Never place `ADMIN_API_KEY` in frontend environment variables (`VITE_*`).

---

## 1. Prerequisites
- Node.js `v20+` and `npm`
- A GitHub repository containing this project
- Accounts on:
  - **MongoDB Atlas** (Free M0 or higher)
  - **Render** (Web Service)
  - **Vercel** (Static / Vite project)

---

## 2. Environment Variable Setup

### Development vs. Production
- **Development:** Uses `server/.env` and `client/.env`. Leave `VITE_API_BASE_URL` empty in `client/.env` so Vite proxies `/api/*` to `http://localhost:5000`.
- **Production:** Configure environment variables directly in the Render and Vercel dashboards. See [`.env.example`](../.env.example).

| Variable | Where | Required | Example / Notes |
|---|---|---|---|
| `NODE_ENV` | Render (Backend) | Yes | `production` |
| `PORT` | Render (Backend) | Yes | Set automatically by Render (e.g. `10000`) |
| `CORS_ORIGIN` | Render (Backend) | Yes | Exact Vercel URL, e.g. `https://greengrid-india.vercel.app` (never `*`) |
| `MONGODB_URI` | Render (Backend) | Recommended | MongoDB Atlas SRV URI (`mongodb+srv://...`) |
| `ADMIN_API_KEY` | Render (Backend) | Optional | Strong random secret; enables `POST`/`PATCH`/`DELETE` and `/api/v1/rea/*` routes |
| `VITE_API_BASE_URL` | Vercel (Frontend) | Yes | Exact Render URL without trailing slash, e.g. `https://greengrid-india-api.onrender.com` |

---

## 3. MongoDB Atlas Setup
1. Log into MongoDB Atlas and create a cluster (e.g. M0 Sandbox in `ap-south-1` Mumbai).
2. Under **Database Access**, create a dedicated database user with a strong random password and least-privilege `readWrite` role on the `greengrid_india` database.
3. Under **Network Access**, restrict IP access as tightly as possible (or add Render's outbound IPs / temporary `0.0.0.0/0` only if dynamic IPs are required).
4. Copy the Node.js SRV connection string:
   ```text
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/greengrid_india?retryWrites=true&w=majority
   ```
5. Store this value ONLY in Render's `MONGODB_URI` environment variable (or `server/.env` locally).
   - If `MONGODB_URI` is omitted, the backend still starts cleanly and `/api/health` honestly reports `"status": "degraded"` and `"database.status": "unconfigured"`.

---

## 4. Render Backend Deployment
A Blueprint file ([`render.yaml`](../render.yaml)) is included at the repository root.

1. In Render, click **New + -> Web Service** and connect your GitHub repository.
2. Configure the service:
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start` (runs `node dist/index.js`)
   - **Health Check Path:** `/api/health`
3. Add the backend environment variables (`NODE_ENV=production`, `CORS_ORIGIN`, `MONGODB_URI`, `ADMIN_API_KEY`).
4. Deploy and note the generated URL (e.g. `https://greengrid-india-api.onrender.com`).

---

## 5. Vercel Frontend Deployment
A SPA rewrite configuration ([`client/vercel.json`](../client/vercel.json)) is included so React Router routes (`/calculator`, `/policies`, `/rpo`, `/finance`, `/jobs`, `/admin`) work on direct page refresh.

1. In Vercel, click **Add New... -> Project** and import your GitHub repository.
2. Configure the project:
   - **Root Directory:** `client`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add the environment variable:
   - `VITE_API_BASE_URL=https://greengrid-india-api.onrender.com` (your Render URL, no trailing slash).
4. Deploy and copy your Vercel production URL (e.g. `https://greengrid-india.vercel.app`).

---

## 6. Connecting Frontend, Backend & CORS
1. Return to Render -> **Environment** and set `CORS_ORIGIN` to your exact Vercel URL (`https://greengrid-india.vercel.app`). If you use multiple domains, separate them with commas.
2. Save changes on Render so the backend restarts with the updated CORS allowlist.
3. Verify `parseEnv` in `server/src/config/env.ts` rejects wildcard `*` in `CORS_ORIGIN` when `NODE_ENV=production`.

---

## 7. Health-Check Verification
After both services deploy, verify:
1. **Backend Health:**
   ```bash
   curl https://greengrid-india-api.onrender.com/api/health
   ```
   Expected when Atlas is connected: `"status": "ok"` and `"database.connected": true`.
   Expected when Atlas is not configured: `"status": "degraded"` and `"database.connected": false`.
2. **System Status:**
   ```bash
   curl https://greengrid-india-api.onrender.com/api/v1/system/status
   ```
3. **Frontend Routes:** Visit `/`, `/calculator`, `/policies`, `/rpo`, `/finance`, `/jobs`, and `/admin`, and hard-refresh the browser on each route to confirm `vercel.json` serves `index.html`.

---

## 8. Troubleshooting
- **`503 DATABASE_UNAVAILABLE` on API calls:** `MONGODB_URI` is missing, malformed, or blocked by MongoDB Atlas Network Access. Verify the SRV string and Atlas IP allowlist.
- **CORS blocked in browser console:** Ensure `CORS_ORIGIN` on Render matches the exact `https://...` Vercel origin (no trailing slash, no `*`).
- **`404 NOT_FOUND` when refreshing `/policies` or `/rpo` on Vercel:** Ensure Vercel **Root Directory** is set to `client` so `client/vercel.json` is applied.
- **`403 ADMIN_AUTH_NOT_CONFIGURED` on admin writes:** `ADMIN_API_KEY` is intentionally fail-closed when unset on Render. Set `ADMIN_API_KEY` on Render to enable privileged endpoints.

