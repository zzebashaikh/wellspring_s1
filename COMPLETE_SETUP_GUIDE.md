# WellSpring Hospital Management System - Complete Setup Guide

## 🏥 System Overview

The WellSpring Hospital Management System is a comprehensive web application for managing hospital resources, patient admissions, and resource allocation. The system consists of:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Firebase Admin SDK
- **Database**: Google Firestore + MongoDB (optional)
- **Authentication**: Firebase Auth with receptionist accounts

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Google Firebase project** with Firestore enabled
- **Firebase service account key** (`service-account.json`)

### 1. Install Dependencies

```bash
# Navigate to the project directory
cd /Users/zebashaikh/Desktop/wellspring_s1

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

The system uses environment variables for configuration. These files are **already created** with proper settings:

#### Backend Environment (`backend/.env`)
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/wellspring_hospital
JWT_SECRET=wellspring_hospital_jwt_secret_2024
CORS_ORIGIN=http://localhost:8081,http://localhost:5173,http://127.0.0.1:8081,http://127.0.0.1:5173
```

#### Frontend Environment (`frontend/.env.local`)
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FIREBASE_API_KEY=AIzaSyA22HCWpmjkcTwO4v8x8s5HW98oGv46Sac
VITE_FIREBASE_AUTH_DOMAIN=wellspring-4c4c0.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wellspring-4c4c0
VITE_FIREBASE_STORAGE_BUCKET=wellspring-4c4c0.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=165557430369
VITE_FIREBASE_APP_ID=1:165557430369:web:df9024423b18e38a5e2220
VITE_FIREBASE_MEASUREMENT_ID=G-SBXKCKR9S9
```

### 3. Firebase Configuration

1. **Service Account Setup**:
   - Ensure `service-account.json` is in the `backend/` directory
   - This file contains your Firebase service account credentials
   - **Important**: Never commit this file to version control

2. **Firestore Setup**:
   - Ensure Firestore is enabled in your Firebase project
   - The system will automatically initialize default data on first run
   - No additional configuration needed

### 4. Setup Receptionist Accounts

Create test receptionist accounts for login:

```bash
cd backend
node setup-receptionists.js
```

This creates 8 receptionist accounts with the password `wellspring123`:

1. **Pooja Sharma**: `pooja@wellspring.com`
2. **Aisha Khan**: `aisha@wellspring.com`
3. **Priya Patel**: `priya@wellspring.com`
4. **Meera Singh**: `meera@wellspring.com`
5. **Kavya Gupta**: `kavya@wellspring.com`
6. **John Smith**: `john@wellspring.com`
7. **Sarah Johnson**: `sarah@wellspring.com`
8. **Michael Brown**: `michael@wellspring.com`

### 5. Start the System

#### Option 1: Simple Start (Recommended)
```bash
# Terminal 1 - Backend (with automatic port conflict resolution)
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Option 2: Advanced Start (With Smart Port Detection)
```bash
# Terminal 1 - Backend (uses smart server starter)
cd backend
node start-server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

#### Option 3: One-Line Start (Port Conflict Proof)
```bash
# Kill any existing processes and start backend
kill $(lsof -ti:3001) 2>/dev/null || true && cd backend && npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:8081/api/health

## 🔐 Authentication

### Login Credentials

Use any of the receptionist accounts created in step 4:

- **Email**: Any receptionist email (e.g., `pooja@wellspring.com`)
- **Password**: `wellspring123`

The system supports Firebase authentication with login tracking in Firestore.

## 🧪 Testing the System

### Automated Integration Test

Run the comprehensive integration test to verify all functionality:

```bash
cd /Users/zebashaikh/Desktop/wellspring_s1
./integration_test.sh
```

This test verifies:
- ✅ Health check endpoint
- ✅ Patient management (CRUD operations)
- ✅ Resource management
- ✅ Doctor management
- ✅ Resource allocation
- ✅ Resource release

### Manual Testing Checklist

1. **Login Flow**: Use receptionist credentials to log in
2. **Dashboard**: View resource cards and patient queue
3. **Add Patient**: Register new patients to the system
4. **Allocate Resources**: Assign beds/resources to patients
5. **Ambulance Dispatch**: Send ambulances for patient pickup
6. **Login Tracking**: Check Firebase for receptionist login logs

## 📊 System Features

### ✅ Working Features

1. **Patient Management**
   - Add new patients with complete medical information
   - View patient queue sorted by severity (highest first)
   - Update patient information
   - Delete patients
   - Proper date formatting and display

2. **Resource Management**
   - Real-time resource availability tracking
   - Resource allocation and release
   - Resource utilization analytics
   - Support for: Beds, ICUs, Ventilators, Oxygen, Nurses, Ambulances

3. **Doctor Management**
   - Doctor dropdown with 8 pre-configured doctors
   - Assignment of doctors to patients
   - Specialty information displayed

4. **Dashboard Features**
   - Resource overview cards with utilization percentages
   - Patient queue management with severity indicators
   - Real-time updates when resources are allocated
   - Responsive design for different screen sizes

5. **Authentication & Tracking**
   - Secure Firebase authentication
   - Receptionist login tracking in Firestore
   - Session management
   - Role-based access control

## 🔧 Technical Details

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/patients` | Get all patients |
| POST | `/api/patients` | Create new patient |
| GET | `/api/patients/:id` | Get patient by ID |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |
| POST | `/api/patients/:id/allocate` | Allocate resource to patient |
| GET | `/api/resources` | Get all resources |
| GET | `/api/resources/:type` | Get specific resource |
| POST | `/api/resources/:type/allocate` | Allocate resource |
| POST | `/api/resources/:type/release` | Release resource |
| GET | `/api/resources/doctors/list` | Get doctors list |

### Data Structure

**Patient Object**:
```typescript
{
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  contact: string;
  emergencyContact?: string;
  diagnosis?: string;
  assignedDoctor?: string;
  ward?: string;
  bedNumber?: string;
  isICU?: boolean;
  needsVentilator?: boolean;
  needsOxygen?: boolean;
  severity: number; // 1-5 priority
  status: 'Waiting' | 'Admitted';
  notes?: string;
  admissionDateTime: string; // ISO format
  allocatedResource?: string;
}
```

**Resource Object**:
```typescript
{
  beds: { total: number; available: number; cleaning: number };
  icus: { total: number; available: number; cleaning: number };
  ventilators: { total: number; available: number };
  oxygen: { total: number; available: number; empty: number };
  nurses: { total: number; available: number };
  ambulances: { total: number; available: number; onTrip: number; maintenance: number };
  wards: Record<string, { total: number; available: number; cleaning: number }>;
}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

1. **Port Already in Use (EADDRINUSE)**:
   ```bash
   # Solution 1: Kill existing processes
   kill $(lsof -ti:3001) 2>/dev/null || true
   
   # Solution 2: Use alternative port
   PORT=3002 npm start
   
   # Solution 3: Use smart server starter
   node start-server.js
   ```

2. **Firebase Connection Issues**:
   - Verify `service-account.json` is in the `backend/` directory
   - Check Firebase project configuration matches your project
   - Ensure Firestore is enabled in Firebase Console
   - Verify environment variables are correct

3. **CORS Issues**:
   - Verify frontend is running on port 8081
   - Check CORS_ORIGIN configuration in backend `.env`
   - Ensure Vite proxy is configured correctly

4. **API Connection Issues**:
   - Verify Vite proxy configuration in `frontend/vite.config.ts`
   - Check that backend is running on port 3001
   - Test health endpoint: `curl http://localhost:3001/api/health`

5. **Authentication Issues**:
   - Ensure receptionist accounts are created: `node setup-receptionists.js`
   - Check Firebase project ID matches environment variables
   - Verify Firestore rules allow write operations

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

### Health Checks

Test system health:
```bash
# Backend health
curl http://localhost:3001/api/health

# Auth service health
curl http://localhost:3001/api/auth/health
```

## 📁 Project Structure

```
wellspring_s1/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and Firebase config
│   │   ├── middleware/      # Authentication middleware
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Data initialization
│   │   └── server.js        # Main server file
│   ├── service-account.json # Firebase credentials (DO NOT COMMIT)
│   ├── .env                 # Backend environment variables
│   ├── start-server.js      # Smart server starter
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # API utilities
│   │   └── firebase/        # Firebase config
│   ├── .env.local           # Frontend environment variables
│   ├── vite.config.ts       # Vite configuration with proxy
│   └── package.json
├── integration_test.sh      # Comprehensive test script
└── COMPLETE_SETUP_GUIDE.md  # This guide
```

## 🎯 Success Criteria

The system is considered fully functional when:

- ✅ Patients can be added successfully from the frontend
- ✅ Doctor dropdown shows correct names and specialties
- ✅ Patient queue displays correctly with proper sorting
- ✅ Resource allocation works for all resource types
- ✅ Dashboard interactions work without errors
- ✅ All API endpoints respond correctly
- ✅ Authentication system works with receptionist credentials
- ✅ Real-time updates reflect changes immediately
- ✅ Login tracking works in Firestore

## 🚀 Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure proper Firebase production credentials
3. Set up proper CORS origins for production domain
4. Configure SSL certificates
5. Set up proper logging and monitoring
6. Configure backup strategies for Firestore data
7. Use environment-specific service account files

## 📈 Monitoring and Logs

### Firebase Console
- **Authentication**: https://console.firebase.google.com/project/wellspring-4c4c0/authentication
- **Firestore**: https://console.firebase.google.com/project/wellspring-4c4c0/firestore
- **Login Tracking**: Check `receptionistLogins` collection for detailed logs

### System Logs
- Backend logs: Check terminal running `npm start`
- Frontend logs: Check browser console
- API logs: Available in backend terminal

## 🎉 You're All Set!

Your WellSpring Hospital Management System now has:
- ✅ React frontend with modern UI
- ✅ Node.js backend with Express
- ✅ Firebase authentication and Firestore database
- ✅ RESTful API endpoints
- ✅ Comprehensive resource management
- ✅ Patient queue management
- ✅ Real-time updates
- ✅ Login tracking and audit trail

**System Status**: ✅ FULLY FUNCTIONAL  
**Last Updated**: January 2025  
**Version**: 1.0.0

Happy coding! 🚀🏥
