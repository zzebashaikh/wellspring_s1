// routes/resources.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
const resourcesCollection = db.collection('resources');

// Initialize default resources if they don't exist
const initializeResources = async () => {
  try {
    const snapshot = await resourcesCollection.get();
    if (snapshot.empty) {
      const defaultResources = {
        beds: { total: 200, available: 150, cleaning: 10 },
        icus: { total: 50, available: 30, cleaning: 5 },
        ventilators: { total: 30, available: 25 },
        oxygen: { total: 100, available: 75, empty: 10 },
        nurses: { total: 150, available: 120 },
        ambulances: { total: 20, available: 15, onTrip: 3, maintenance: 2 },
        wards: {
          'General': { total: 100, available: 80, cleaning: 5 },
          'Pediatrics': { total: 40, available: 30, cleaning: 2 },
          'Maternity': { total: 30, available: 25, cleaning: 1 },
          'Surgery': { total: 30, available: 15, cleaning: 2 },
        },
      };
      await resourcesCollection.doc('hospital').set(defaultResources);
      console.log('Default resources initialized in Firestore');
    }
  } catch (error) {
    console.error('Error initializing resources:', error);
  }
};

// Initialize resources on startup
initializeResources();

// Get all resources
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  try {
    const snapshot = await resourcesCollection.get();
    if (snapshot.empty) {
      return res.status(404).json({ success: false, message: 'Resources not found' });
    }
    // Find the main hospital resources document
    const hospitalDoc = snapshot.docs.find(doc => doc.id === 'hospital');
    if (!hospitalDoc) {
      return res.status(404).json({ success: false, message: 'Hospital resources not found' });
    }
    // Return the hospital resources directly
    res.json({ success: true, data: hospitalDoc.data() });
  } catch (error) {
    console.error('Firestore error in resources:', error);
    
    // If Firestore fails completely, return mock data for demo purposes
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Firestore unavailable, returning mock resources for demo');
      const mockResources = {
        beds: { total: 200, available: 150, cleaning: 10 },
        icus: { total: 50, available: 30, cleaning: 5 },
        ventilators: { total: 30, available: 25 },
        oxygen: { total: 100, available: 75, empty: 10 },
        nurses: { total: 150, available: 120 },
        ambulances: { total: 20, available: 15, onTrip: 3, maintenance: 2 },
        wards: {
          'General': { total: 100, available: 80, cleaning: 5 },
          'Pediatrics': { total: 40, available: 30, cleaning: 2 },
          'Maternity': { total: 30, available: 25, cleaning: 1 },
          'Surgery': { total: 30, available: 15, cleaning: 2 },
        },
      };
      res.json({ success: true, data: mockResources });
    } else {
      throw error;
    }
  }
}));

// Get doctors list (place this BEFORE parameterized routes)
router.get('/doctors/list', authenticateToken, asyncHandler(async (req, res) => {
  // Try Firestore collection 'doctors' with docs having a 'name' field
  const doctorsSnapshot = await db.collection('doctors').get();
  let doctors = [];
  if (!doctorsSnapshot.empty) {
    doctors = doctorsSnapshot.docs.map(d => d.data().name).filter(Boolean);
  }
  // Fallback to static seed if Firestore empty
  if (doctors.length === 0) {
    doctors = [
      'Dr. A. Mehta (Cardiology)',
      'Dr. R. Iyer (Neurology)',
      'Dr. S. Nair (Pediatrics)',
      'Dr. P. Desai (Orthopedics)',
      'Dr. K. Shah (General Medicine)',
      'Dr. V. Kulkarni (Surgery)',
      'Dr. M. Gupta (Oncology)',
      'Dr. S. Chatterjee (Pulmonology)',
    ];
  }
  res.json({ success: true, data: doctors });
}));

// Get specific resource
router.get('/:resourceType', authenticateToken, asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  const doc = await resourcesCollection.doc(resourceType).get();
  if (!doc.exists) {
    return res.status(404).json({ success: false, message: 'Resource type not found' });
  }
  res.json({ success: true, data: doc.data() });
}));

// Update resource availability
router.put('/:resourceType', authenticateToken, asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  const updateData = req.body;
  const docRef = resourcesCollection.doc(resourceType);
  const doc = await docRef.get();
  if (!doc.exists) {
    return res.status(404).json({ success: false, message: 'Resource type not found' });
  }
  const updatedResource = { ...doc.data(), ...updateData };
  await docRef.update(updatedResource);
  res.json({ success: true, message: `${resourceType} updated successfully`, data: updatedResource });
}));

// Allocate resource (decrease available count)
router.post('/:resourceType/allocate', authenticateToken, asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  // Handle special cases for hospital resources stored under 'hospital' document
  if (['beds', 'icus', 'ventilators', 'oxygen', 'nurses', 'ambulances'].includes(resourceType)) {
    const docRef = resourcesCollection.doc('hospital');
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Hospital resources not found' });
    }
    const hospitalData = doc.data();
    const resourceData = hospitalData[resourceType];
    if (!resourceData || resourceData.available <= 0) {
      return res.status(400).json({ success: false, message: `No ${resourceType} available` });
    }
    // Update the specific resource availability
    const updatedHospitalData = {
      ...hospitalData,
      [resourceType]: {
        ...resourceData,
        available: resourceData.available - 1
      }
    };
    await docRef.update(updatedHospitalData);
    return res.json({ success: true, message: `${resourceType} allocated successfully`, data: updatedHospitalData });
  }
  // Handle individual resource documents
  const docRef = resourcesCollection.doc(resourceType);
  const doc = await docRef.get();
  if (!doc.exists) {
    return res.status(404).json({ success: false, message: 'Resource type not found' });
  }
  const resource = doc.data();
  if (resource.available <= 0) {
    return res.status(400).json({ success: false, message: `No ${resourceType} available` });
  }
  // Decrease available count
  const updatedResource = { ...resource, available: resource.available - 1 };
  await docRef.update(updatedResource);
  res.json({ success: true, message: `${resourceType} allocated successfully`, data: updatedResource });
}));

// Release resource (increase available count)
router.post('/:resourceType/release', authenticateToken, asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  // Handle hospital-level resources stored under 'hospital'
  if (['beds', 'icus', 'ventilators', 'oxygen', 'nurses', 'ambulances'].includes(resourceType)) {
    const docRef = resourcesCollection.doc('hospital');
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Hospital resources not found' });
    }
    const hospitalData = doc.data();
    const resourceData = hospitalData[resourceType];
    if (!resourceData) {
      return res.status(404).json({ success: false, message: 'Resource type not found' });
    }
    if (resourceData.available >= resourceData.total) {
      return res.status(400).json({ success: false, message: `All ${resourceType} are already available` });
    }
    const updatedHospitalData = {
      ...hospitalData,
      [resourceType]: {
        ...resourceData,
        available: resourceData.available + 1,
      },
    };
    await docRef.update(updatedHospitalData);
    return res.json({ success: true, message: `${resourceType} released successfully`, data: updatedHospitalData });
  }
  // Fallback for individual resource documents
  const docRef = resourcesCollection.doc(resourceType);
  const doc = await docRef.get();
  if (!doc.exists) {
    return res.status(404).json({ success: false, message: 'Resource type not found' });
  }
  const resource = doc.data();
  if (resource.available >= resource.total) {
    return res.status(400).json({ success: false, message: `All ${resourceType} are already available` });
  }
  const updatedResource = { ...resource, available: resource.available + 1 };
  await docRef.update(updatedResource);
  res.json({ success: true, message: `${resourceType} released successfully`, data: updatedResource });
}));

export default router;
