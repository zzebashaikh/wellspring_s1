// Utility script to initialize ambulance resources in Firestore
// Run this once to set up the ambulance resources collection

import { initializeAmbulanceResources } from './firestore';

/**
 * Initialize ambulance resources in Firestore
 * This should be run once to set up the ambulance resources collection
 */
export async function runAmbulanceInitialization() {
  try {
    console.log('🚑 Initializing ambulance resources...');
    await initializeAmbulanceResources();
    console.log('✅ Ambulance resources initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize ambulance resources:', error);
    throw error;
  }
}

// If this file is run directly, execute the initialization
if (typeof window !== 'undefined') {
  // Browser environment - you can call this from the browser console
  (window as any).initializeAmbulanceResources = runAmbulanceInitialization;
  console.log('💡 To initialize ambulance resources, run: initializeAmbulanceResources()');
}
