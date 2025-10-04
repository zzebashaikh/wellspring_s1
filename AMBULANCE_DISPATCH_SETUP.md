# Ambulance Dispatch Feature Setup Guide

This guide explains the complete ambulance dispatch feature implementation for WellSpring Hospital.

## 🚑 Feature Overview

The ambulance dispatch feature allows receptionists to:
- Create emergency dispatch requests with patient details
- Automatically assign available ambulances
- Track dispatch status in real-time
- View dispatch history
- Monitor ambulance availability (out of 15 total ambulances)

## 📋 Frontend Form Fields

The ambulance dispatch form includes:
- **Patient Name** (required)
- **Age** (required, number)
- **Contact** (required, phone number)
- **Severity Level** (required, 1-5 scale)
- **Pickup Address** (required, textarea)

## 🗄️ Firestore Collections

### 1. `ambulanceDispatch` Collection
Each document contains:
```typescript
{
  id: string;                    // Auto-generated document ID
  patientName: string;           // Patient's full name
  age: number;                   // Patient's age
  contactNumber: string;         // Contact phone number
  severityLevel: number;         // 1-5 severity scale
  pickupAddress: string;         // Complete pickup address
  assignedAmbulanceID: string;   // Assigned ambulance ID (e.g., "AMB-001")
  dispatchTime: Timestamp;       // Server timestamp when dispatched
  ambulanceStatus: string;       // "Available" | "En Route" | "Busy"
  dispatchedBy: string;          // Receptionist UID who created dispatch
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
}
```

### 2. `ambulanceResources` Collection
Each document contains:
```typescript
{
  id: string;                    // Auto-generated document ID
  ambulanceId: string;           // Human-readable ID (e.g., "AMB-001")
  status: string;                // "Available" | "En Route" | "Busy" | "Maintenance"
  currentDispatchId: string;     // ID of current dispatch (if any)
  lastUpdated: Timestamp;        // Last status update
}
```

## 🔧 Backend API Endpoints

### POST `/api/ambulance/dispatch`
Create a new ambulance dispatch
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ patientName, age, contactNumber, severityLevel, pickupAddress }`
- **Response**: `{ success: true, data: { dispatchId, assignedAmbulanceID, ... } }`

### GET `/api/ambulance/dispatches?limit=50`
Get recent ambulance dispatches
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, data: [dispatch1, dispatch2, ...] }`

### GET `/api/ambulance/availability`
Get current ambulance availability
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, data: { total, available, onTrip, maintenance } }`

### PUT `/api/ambulance/dispatch/:dispatchId/status`
Update dispatch status
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ status: "Available" | "En Route" | "Busy" }`

### POST `/api/ambulance/initialize`
Initialize ambulance resources (admin only)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, message: "Initialized 15 ambulance resources" }`

## 🚀 Setup Instructions

### 1. Backend Setup
The backend routes are already configured in `backend/src/routes/ambulance.js` and registered in `server.js`.

### 2. Initialize Ambulance Resources
Run the initialization script to create 15 ambulance resources:

```bash
# From the backend directory
cd backend
node src/scripts/initializeAmbulanceResources.js
```

Or the resources will be automatically initialized when the server starts (if the collection is empty).

### 3. Frontend Integration
The frontend components are already integrated:
- `AmbulanceDispatch.tsx` - Form for creating dispatches
- `AmbulanceHistory.tsx` - View recent dispatches
- Real-time availability updates in the dashboard

## 🔄 Real-time Features

### Ambulance Availability
- Real-time listener updates ambulance count automatically
- Dashboard shows current availability out of 15 total ambulances
- Updates immediately when dispatches are created or completed

### Dispatch History
- Shows recent dispatches with status badges
- Displays patient details, assigned ambulance, and timestamps
- Refresh button to reload latest data

## 🔐 Authentication & Security

- All API endpoints require Firebase authentication
- Only users with `receptionist` role can create dispatches
- Proper error handling and validation on all endpoints
- Firestore security rules should be configured to restrict access

## 📊 Dashboard Integration

The ambulance dispatch feature is integrated into the main dashboard:
- **Resource Cards**: Shows real-time ambulance availability
- **Dispatch Form**: Allows creating new dispatches
- **History Panel**: Shows recent dispatch activity
- **Analytics**: Includes ambulance metrics

## 🛠️ Development Notes

### Firestore Functions
Key functions in `frontend/src/firebase/firestore.ts`:
- `createAmbulanceDispatch()` - Creates new dispatch with automatic ambulance assignment
- `findAvailableAmbulance()` - Finds next available ambulance
- `getAmbulanceAvailability()` - Real-time availability listener
- `updateAmbulanceDispatchStatus()` - Updates dispatch and ambulance status

### API Functions
Key functions in `frontend/src/utils/api.ts`:
- `ambulanceAPI.createDispatch()` - Frontend API wrapper
- `ambulanceAPI.getAvailability()` - Get current availability
- `ambulanceAPI.getDispatches()` - Get dispatch history

### Error Handling
- Comprehensive error handling in all API calls
- User-friendly error messages via toast notifications
- Graceful fallbacks for network issues

## 🧪 Testing

To test the feature:
1. Start the backend server
2. Start the frontend development server
3. Login as a receptionist
4. Navigate to the Ambulance Dispatch section
5. Fill out the form and submit
6. Verify the dispatch appears in the history
7. Check that ambulance availability decreases

## 🔧 Troubleshooting

### Common Issues:
1. **No ambulances available**: Run the initialization script
2. **Authentication errors**: Ensure Firebase auth is properly configured
3. **Real-time updates not working**: Check Firestore security rules
4. **Form submission fails**: Check browser console for API errors

### Debug Commands:
```bash
# Check ambulance resources
# In browser console:
ambulanceAPI.getAvailability().then(console.log)

# Initialize resources manually
# In browser console:
ambulanceAPI.initializeResources()
```

## 📈 Future Enhancements

Potential improvements:
- GPS tracking for ambulances
- Estimated arrival times
- Dispatch priority queuing
- SMS notifications to patients
- Integration with hospital management system
- Mobile app for ambulance drivers
- Real-time location updates
- Dispatch analytics and reporting

---

The ambulance dispatch feature is now fully integrated and ready for use! 🚑✨
