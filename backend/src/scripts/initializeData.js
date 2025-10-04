// Initialize Firestore with default data
import { db } from '../config/firebase.js';
import initializeAmbulanceResources from './initializeAmbulanceResources.js';

const initializeFirestoreData = async () => {
  try {
    console.log('🌱 Initializing Firestore data...');

    // Initialize Hospital Resources
    const hospitalResourcesRef = db.collection('resources').doc('hospital');
    const hospitalResourcesSnap = await hospitalResourcesRef.get();

    if (!hospitalResourcesSnap.exists) {
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
      
      await hospitalResourcesRef.set(defaultResources);
      console.log('✅ Hospital resources initialized');
    }

    // Initialize sample patients
    const patientsRef = db.collection('patients');
    const patientsSnap = await patientsRef.limit(1).get();

    if (patientsSnap.empty) {
      const samplePatients = [
        {
          name: 'Rajesh Kumar',
          age: 45,
          gender: 'Male',
          contact: '+91 98765 43210',
          emergencyContact: '+91 91234 56789',
          diagnosis: 'Chest pain',
          assignedDoctor: 'Dr. A. Mehta (Cardiology)',
          ward: 'General',
          bedNumber: 'A101',
          isICU: false,
          needsVentilator: false,
          needsOxygen: true,
          severity: 4,
          status: 'Waiting',
          notes: 'Patient experiencing chest pain, requires immediate attention',
          admissionDateTime: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        },
        {
          name: 'Priya Sharma',
          age: 28,
          gender: 'Female',
          contact: '+91 87654 32109',
          emergencyContact: '+91 82345 67890',
          diagnosis: 'Appendicitis',
          assignedDoctor: 'Dr. V. Kulkarni (Surgery)',
          ward: 'Surgery',
          bedNumber: 'S205',
          isICU: false,
          needsVentilator: false,
          needsOxygen: false,
          severity: 5,
          status: 'Waiting',
          notes: 'Acute appendicitis, requires immediate surgery',
          admissionDateTime: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
        },
        {
          name: 'Ankit Patel',
          age: 35,
          gender: 'Male',
          contact: '+91 76543 21098',
          emergencyContact: '+91 73456 78901',
          diagnosis: 'Fracture in right leg',
          assignedDoctor: 'Dr. P. Desai (Orthopedics)',
          ward: 'General',
          bedNumber: '',
          isICU: false,
          needsVentilator: false,
          needsOxygen: false,
          severity: 2,
          status: 'Waiting',
          notes: 'Compound fracture from motorcycle accident',
          admissionDateTime: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
        }
      ];

      for (const patient of samplePatients) {
        await patientsRef.add(patient);
      }
      console.log('✅ Sample patients initialized');
    }

    // Initialize ambulance resources
    const ambulanceResourcesRef = db.collection('ambulanceResources');
    const ambulanceResourcesSnap = await ambulanceResourcesRef.limit(1).get();

    if (ambulanceResourcesSnap.empty) {
      await initializeAmbulanceResources();
      console.log('✅ Ambulance resources initialized');
    }

    console.log('🎉 Firestore initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing Firestore data:', error);
    throw error;
  }
};

// Initialize data if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeFirestoreData()
    .then(() => {
      console.log('✅ Data initialization successful');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data initialization failed:', error);
      process.exit(1);
    });
}

export default initializeFirestoreData;
