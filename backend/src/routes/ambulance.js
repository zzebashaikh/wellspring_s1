import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// Create new ambulance dispatch
router.post('/dispatch', authenticateToken, asyncHandler(async (req, res) => {
    const { patientName, age, contactNumber, severityLevel, pickupAddress } = req.body;

    // Validate required fields
    if (!patientName || !age || !contactNumber || !severityLevel || !pickupAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, age, contactNumber, severityLevel, pickupAddress'
      });
    }

    // Validate severity level
    if (severityLevel < 1 || severityLevel > 5) {
      return res.status(400).json({
        success: false,
        message: 'Severity level must be between 1 and 5'
      });
    }

    // Find an available ambulance
    const availableAmbulanceQuery = await db.collection('ambulanceAvailability')
      .where('status', '==', 'Available')
      .limit(1)
      .get();

    if (availableAmbulanceQuery.empty) {
      return res.status(409).json({
        success: false,
        message: 'No ambulances available for dispatch'
      });
    }

    const availableAmbulance = availableAmbulanceQuery.docs[0];
    const ambulanceId = availableAmbulance.id;

    // Create dispatch record
    const dispatchData = {
      patientName,
      age: parseInt(age),
      contactNumber,
      severityLevel: parseInt(severityLevel),
      pickupAddress,
      assignedAmbulanceID: ambulanceId,
      dispatchTime: admin.firestore.FieldValue.serverTimestamp(),
      ambulanceStatus: 'En Route',
      dispatchedBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Create dispatch record
      const dispatchRef = db.collection('ambulanceDispatches').doc();
      transaction.set(dispatchRef, dispatchData);

      // Update ambulance status
      const ambulanceRef = db.collection('ambulanceAvailability').doc(ambulanceId);
      transaction.update(ambulanceRef, {
        status: 'En Route',
        currentDispatchId: dispatchRef.id,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      return dispatchRef.id;
    });

    res.status(201).json({
      success: true,
      message: 'Ambulance dispatched successfully',
      data: {
        dispatchId: result,
        assignedAmbulanceID: ambulanceId,
        ...dispatchData
      }
    });
}));

// Get all ambulance dispatches
router.get('/dispatches', authenticateToken, asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const dispatchesQuery = await db.collection('ambulanceDispatches')
      .orderBy('dispatchTime', 'desc')
      .limit(limit)
      .get();

    const dispatches = [];
    dispatchesQuery.forEach(doc => {
      dispatches.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: dispatches });
}));

// Get ambulance availability
router.get('/availability', authenticateToken, asyncHandler(async (req, res) => {
    const ambulancesQuery = await db.collection('ambulanceAvailability').get();
    let availableCount = 0;
    let totalCount = 0;
    let onTripCount = 0;
    let maintenanceCount = 0;

    ambulancesQuery.forEach(doc => {
      const data = doc.data();
      totalCount++;
      switch (data.status) {
        case 'Available':
          availableCount++;
          break;
        case 'En Route':
        case 'Busy':
          onTripCount++;
          break;
        case 'Maintenance':
          maintenanceCount++;
          break;
      }
    });

    res.json({ success: true, data: { total: totalCount, available: availableCount, onTrip: onTripCount, maintenance: maintenanceCount } });
}));

// Update dispatch status
router.put('/dispatch/:dispatchId/status', authenticateToken, asyncHandler(async (req, res) => {
    const { dispatchId } = req.params;
    const { status } = req.body;

    if (!['Available', 'En Route', 'Busy'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be one of: Available, En Route, Busy' });
    }

    const dispatchRef = db.collection('ambulanceDispatches').doc(dispatchId);
    const dispatchDoc = await dispatchRef.get();
    if (!dispatchDoc.exists) {
      return res.status(404).json({ success: false, message: 'Dispatch record not found' });
    }

    const dispatchData = dispatchDoc.data();

    // Use transaction to update both dispatch and ambulance status
    await db.runTransaction(async (transaction) => {
      // Update dispatch status
      transaction.update(dispatchRef, { ambulanceStatus: status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

      // If status is Available, also update the ambulance resource
      if (status === 'Available' && dispatchData.assignedAmbulanceID) {
        const ambulanceRef = db.collection('ambulanceAvailability').doc(dispatchData.assignedAmbulanceID);
        transaction.update(ambulanceRef, { status: 'Available', currentDispatchId: null, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
      }
    });

    // If reaching 'Available', create/add patient to queue if not already present
    if (status === 'Available') {
      try {
        const { patientName, age, contactNumber, severityLevel } = dispatchData;
        const existing = await db
          .collection('patients')
          .where('contact', '==', contactNumber)
          .limit(1)
          .get();
        if (existing.empty) {
          // Create patient with proper structure matching frontend expectations
          const patientData = {
            name: patientName,
            age: parseInt(age),
            gender: 'Prefer not to say',
            contact: contactNumber,
            emergencyContact: '',
            diagnosis: '',
            assignedDoctor: '',
            ward: 'General',
            bedNumber: '',
            isICU: false,
            needsVentilator: false,
            needsOxygen: false,
            severity: parseInt(severityLevel) || 3,
            status: 'Waiting',
            notes: `Patient arrived via ambulance ${dispatchData.assignedAmbulanceID}`,
            admissionDateTime: admin.firestore.FieldValue.serverTimestamp(),
            source: 'ambulance',
            allocatedResource: null
          };
          await db.collection('patients').add(patientData);
          console.log(`Patient ${patientName} added to queue after ambulance reached hospital`);
        } else {
          console.log(`Patient ${patientName} already exists in queue`);
        }
      } catch (patientErr) {
        console.error('Warning: Failed to add patient to queue after ambulance reached hospital:', patientErr);
        // Do not fail the whole request; ambulance status update already succeeded
      }
    }

    res.json({ success: true, message: 'Dispatch status updated successfully' });
}));

// Initialize ambulance resources (admin only)
router.post('/initialize', authenticateToken, asyncHandler(async (req, res) => {
    // Check if user is admin (you might want to add admin role check here)
    const totalAmbulances = 15;
    const batch = db.batch();

    for (let i = 1; i <= totalAmbulances; i++) {
      const ambulanceRef = db.collection('ambulanceAvailability').doc();
      batch.set(ambulanceRef, { id: `AMB-${i.toString().padStart(3, '0')}`, status: 'Available', currentDispatchId: null, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
    }

    await batch.commit();

    res.json({ success: true, message: `Initialized ${totalAmbulances} ambulance resources` });
}));

export default router;
