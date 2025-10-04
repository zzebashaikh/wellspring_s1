import { db } from '../config/firebase.js';

/**
 * Initialize ambulance resources in Firestore
 * This script creates 15 ambulance resources with status 'Available'
 */
async function initializeAmbulanceResources() {
  try {
    console.log('🚑 Initializing ambulance resources...');
    
    const totalAmbulances = 15;
    const batch = db.batch();

    for (let i = 1; i <= totalAmbulances; i++) {
      const ambulanceRef = db.collection('ambulanceResources').doc();
      batch.set(ambulanceRef, {
        id: `AMB-${i.toString().padStart(3, '0')}`,
        status: 'Available',
        currentDispatchId: null,
        lastUpdated: new Date()
      });
    }

    await batch.commit();
    console.log(`✅ Successfully initialized ${totalAmbulances} ambulance resources`);
    
    // Verify the initialization
    const snapshot = await db.collection('ambulanceResources').get();
    console.log(`📊 Total ambulance resources in database: ${snapshot.size}`);
    
    let availableCount = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Available') {
        availableCount++;
      }
    });
    console.log(`📊 Available ambulances: ${availableCount}`);
    
  } catch (error) {
    console.error('❌ Error initializing ambulance resources:', error);
    throw error;
  }
}

// Run the initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeAmbulanceResources()
    .then(() => {
      console.log('🎉 Ambulance resources initialization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error);
      process.exit(1);
    });
}

export default initializeAmbulanceResources;
