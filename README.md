# WellSpring Hospital Management System

A comprehensive hospital management system built with **React**, **Node.js**, and **Firebase**.

## System Overview

The WellSpring Hospital Management System is a full-stack web application designed to manage hospital resources, patient admissions, and resource allocation efficiently. It integrates real-time updates with Firebase to ensure accurate resource tracking.

### Architecture

* **Frontend:** React + TypeScript + Vite + Tailwind CSS
* **Backend:** Node.js + Express + Firebase Admin SDK
* **Database:** Google Firestore
* **Authentication:** Firebase Authentication with receptionist accounts

## Quick Start

For complete setup instructions, refer to **[COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)**.

### Prerequisites

* Node.js (v16 or higher)
* npm
* A configured Google Firebase project with Firestore enabled
* Firebase service account key

### Installation

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup receptionist accounts
cd ../backend && node setup-receptionists.js

# Start the system
cd backend && npm start
# In another terminal:
cd frontend && npm run dev
```

### Access

* **Frontend:** [http://localhost:8081](http://localhost:8081)
* **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

## Unified Commands (Root)

From the repository root `wellspring_s1/`, both applications can be managed together.

```bash
# Install root tools and dependencies
npm install
npm --prefix backend install
npm --prefix frontend install

# Development: starts backend (port 3001) and frontend (port 8081)
npm run dev

# Production: builds frontend and serves it from backend
npm run start:prod
```

Environment samples are provided in `backend/.env.example` and `frontend/.env.example`.

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
