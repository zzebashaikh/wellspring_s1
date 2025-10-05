// routes/patients.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();
const patientsCollection = db.collection('patients');

// GET all patients  
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Order patients by severity (desc) then by admission time (desc)
  // Firestore requires composite index to order by multiple fields; if not present, fallback to single order
  let patients = [];
  try {
    const snapshot = await patientsCollection
      .orderBy('severity', 'desc')
      .orderBy('admissionDateTime', 'desc')
      .get();
    patients = snapshot.docs.map(doc => {
      const data = doc.data();
      // Normalize status to proper case
      if (data.status === 'waiting') data.status = 'Waiting';
      if (data.status === 'in_progress') data.status = 'Admitted';
      // Convert Firestore timestamp to ISO string
      if (data.admissionDateTime && data.admissionDateTime._seconds) {
        data.admissionDateTime = new Date(data.admissionDateTime._seconds * 1000).toISOString();
      }
      return { id: doc.id, ...data };
    });
  } catch (e) {
    // Fallback if composite index missing
    const snapshot = await patientsCollection.orderBy('admissionDateTime', 'desc').get();
    patients = snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Normalize status to proper case
        if (data.status === 'waiting') data.status = 'Waiting';
        if (data.status === 'in_progress') data.status = 'Admitted';
        // Convert Firestore timestamp to ISO string
        if (data.admissionDateTime && data.admissionDateTime._seconds) {
          data.admissionDateTime = new Date(data.admissionDateTime._seconds * 1000).toISOString();
        }
        return { id: doc.id, ...data };
      })
      .sort((a, b) => (b.severity || 0) - (a.severity || 0));
  }
  res.json({ success: true, data: patients, message: `Found ${patients.length} patients` });
}));

// GET patient by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const doc = await patientsCollection.doc(req.params.id).get();
  if (!doc.exists) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }
  const data = doc.data();
  // Convert Firestore timestamp to ISO string
  if (data.admissionDateTime && data.admissionDateTime._seconds) {
    data.admissionDateTime = new Date(data.admissionDateTime._seconds * 1000).toISOString();
  }
  res.json({ success: true, data: { id: doc.id, ...data } });
}));

// POST new patient
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const {
    name,
    age,
    gender,
    contact,
    emergencyContact,
    diagnosis,
    assignedDoctor,
    ward,
    bedNumber,
    isICU,
    needsVentilator,
    needsOxygen,
    severity,
    notes
  } = req.body;

  if (!name || !age || !gender || !contact) {
    return res.status(400).json({ success: false, message: 'Required fields: name, age, gender, contact' });
  }

  // Check duplicates
  const dupQuery = await patientsCollection
    .where('contact', '==', contact)
    .get();
  if (!dupQuery.empty) {
    return res.status(400).json({ success: false, message: 'Patient with same contact already exists' });
  }

  const newPatient = {
    name,
    age: parseInt(age),
    gender,
    contact,
    emergencyContact: emergencyContact || '',
    diagnosis: diagnosis || '',
    assignedDoctor: assignedDoctor || '',
    ward: ward || 'General',
    bedNumber: bedNumber || '',
    isICU: isICU || false,
    needsVentilator: needsVentilator || false,
    needsOxygen: needsOxygen || false,
    severity: severity ? parseInt(severity) : 3,
    status: 'Waiting',
    notes: notes || '',
    admissionDateTime: new Date()
  };

  const docRef = await patientsCollection.add(newPatient);
  const createdPatient = { id: docRef.id, ...newPatient };
  res.status(201).json({ success: true, message: `Patient ${name} added successfully`, data: createdPatient });
}));

// PUT update patient
router.put('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const updateData = req.body;
  const docRef = patientsCollection.doc(req.params.id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  await docRef.update(updateData);
  const updatedDoc = await docRef.get();
  const data = updatedDoc.data();
  // Convert Firestore timestamp to ISO string
  if (data.admissionDateTime && data.admissionDateTime._seconds) {
    data.admissionDateTime = new Date(data.admissionDateTime._seconds * 1000).toISOString();
  }
  res.json({ success: true, message: 'Patient updated successfully', data: { id: updatedDoc.id, ...data } });
}));

// DELETE patient
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const docRef = patientsCollection.doc(req.params.id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  await docRef.delete();
  res.json({ success: true, message: 'Patient deleted successfully', data: { id: docSnap.id, ...docSnap.data() } });
}));

// POST allocate resource
router.post('/:id/allocate', authenticateToken, asyncHandler(async (req, res) => {
  const { allocatedResource } = req.body;
  if (!allocatedResource) {
    return res.status(400).json({ success: false, message: 'allocatedResource is required' });
  }

  const docRef = patientsCollection.doc(req.params.id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  await docRef.update({ allocatedResource, status: 'Admitted' });
  const updatedDoc = await docRef.get();
  const data = updatedDoc.data();
  // Convert Firestore timestamp to ISO string
  if (data.admissionDateTime && data.admissionDateTime._seconds) {
    data.admissionDateTime = new Date(data.admissionDateTime._seconds * 1000).toISOString();
  }
  res.json({ success: true, message: `Resource ${allocatedResource} allocated to ${data.name}`, data: { id: updatedDoc.id, ...data } });
}));

export default router;