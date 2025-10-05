import express from 'express';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';
import { authenticateToken } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.post('/', authenticateToken, asyncHandler(async (req, res) => {
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
}));

export default router;

