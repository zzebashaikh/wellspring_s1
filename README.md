# WellSpring Hospital Management System

A comprehensive hospital management system built with **React**, **Node.js**, and **Firebase**.

## System Overview

The WellSpring Hospital Management System is a full-stack web application designed to manage hospital resources, patient admissions, and resource allocation efficiently. It integrates real-time updates with Firebase to ensure accurate resource tracking.

### Architecture

* **Frontend:** React + TypeScript + Vite + Tailwind CSS
* **Backend:** Node.js + Express + Firebase Admin SDK
* **Database:** Google Firestore
* **Authentication:** Firebase Authentication with receptionist accounts

## Quick Start (Locked/Stable Runbook)

For complete setup instructions, refer to **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)**.

### Prerequisites

* Node.js (v16 or higher)
* npm
* A configured Google Firebase project with Firestore enabled
* Firebase service account key

### Installation

```bash
# Root: install
npm install

# Install exact locked deps in each app (package-lock.json is committed)
npm --prefix backend ci
npm --prefix frontend ci

# Seed optional demo data (same behavior as now)
cd backend && node setup-receptionists.js && cd ..

# Start the system (frontend dev server proxies to backend)
npm --prefix backend start
# In another terminal:
npm --prefix frontend run dev
```

### Access

* **Frontend:** [http://localhost:8081](http://localhost:8081)
* **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

## Unified Commands (Root)

From the repository root `wellspring_s1/`, both applications can be managed together.

```bash
# Development: starts backend (port 3001) and frontend (port 8081)
npm --prefix backend start &
npm --prefix frontend run dev

# Build frontend (if desired) without changing logic
npm --prefix frontend run build
```

Environment samples are provided in `backend/env.example` and `frontend/env.example`.

### Environment Variables (Current Behavior)

Backend (`backend/.env`):

```
NODE_ENV=development
PORT=3001
JWT_SECRET=wellspring_hospital_jwt_secret_2024
DEMO_AUTH_ALLOWED=false
# Comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081
# If omitted, the app will auto-resolve service-account.json in repo
# GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Frontend (`frontend/.env`):

```
# Backend base URL (no trailing slash). Vite proxy adds /api in dev.
VITE_BACKEND_URL=http://localhost:3001
# Alternative legacy name supported
VITE_API_URL=http://localhost:3001

# Firebase Web SDK configuration (matches current defaults)
VITE_FIREBASE_API_KEY=AIzaSyA22HCWpmjkcTwO4v8x8s5HW98oGv46Sac
VITE_FIREBASE_AUTH_DOMAIN=wellspring-4c4c0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wellspring-4c4c0
VITE_FIREBASE_STORAGE_BUCKET=wellspring-4c4c0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=165557430369
VITE_FIREBASE_APP_ID=1:165557430369:web:df9024423b18e38a5e2220
VITE_FIREBASE_MEASUREMENT_ID=G-SBXKCKR9S9
```

Note: These mirror the app's current defaults; override via `.env` files if needed without changing code.

### Reproducibility & Lockfiles

* `backend/package-lock.json` and `frontend/package-lock.json` are committed.
* Use `npm ci` in each app to install exact versions.
* Do not update, refactor, or change APIs/config; this runbook preserves current behavior.

### Login Credentials

Sample receptionist accounts are pre-configured:

* **Email:** `pooja@wellspring.com`
* **Password:** `wellspring123`

## Features

* Patient management with a priority queue
* Resource allocation (beds, ICUs, ventilators, oxygen supply, nurses, ambulances)
* Doctor assignment and management
* Real-time dashboard with analytics
* Firebase authentication and login tracking
* Responsive and accessible design

## Testing

To run the automated integration test:

```bash
./integration_test.sh
```

## Documentation

* **[Complete Setup Guide](./COMPLETE_SETUP_GUIDE.md)** – step-by-step setup instructions
* **[Integration Test](./integration_test.sh)** – automated testing script

## Technologies Used

* **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
* **Backend:** Node.js, Express, Firebase Admin SDK
* **Database:** Google Firestore
* **Authentication:** Firebase Auth
* **Development Tools:** ESLint, Prettier, Hot Reload

## Deployment

For production deployment, see the [Complete Setup Guide](./COMPLETE_SETUP_GUIDE.md#production-deployment).

## License

This project is licensed under the MIT License. See the LICENSE file for details.
