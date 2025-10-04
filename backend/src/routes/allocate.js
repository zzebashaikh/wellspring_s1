import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    // req.user is set by authenticateToken (supports demo tokens in development)

    const { patientId, bed } = req.body;
    if (!patientId || !bed) {
      return res.status(400).json({ message: 'Missing patientId or bed' });
    }

    // Create allocation record in Firestore
    const allocationData = {
      patientId,
      bed,
      allocatedBy: req.user?.uid || 'unknown',
      allocatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const allocationRef = await db.collection('allocations').add(allocationData);

    res.status(201).json({ message: 'Patient allocated successfully', allocation: { id: allocationRef.id, ...allocationData } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

export default router;

