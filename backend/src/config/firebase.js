import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname fix for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveServiceAccountPath() {
  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gacPath && fs.existsSync(gacPath)) {
    return gacPath;
  }
  const cwdPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(cwdPath)) {
    return cwdPath;
  }
  const localPath = path.join(__dirname, '../../service-account.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  return null;
}

function initializeFirebaseAdmin() {
  try {
    // Check if we have the JSON credentials as an environment variable (for Render)
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (credentialsJson) {
      const serviceAccount = JSON.parse(credentialsJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('🔐 Firebase Admin initialized with JSON credentials from environment');
      return;
    }

    const serviceAccountPath = resolveServiceAccountPath();

    if (serviceAccountPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log(`🔐 Firebase Admin initialized with service account at ${serviceAccountPath}`);
      return;
    }

    // Fallback to application default credentials (works if GOOGLE_APPLICATION_CREDENTIALS is set or on GCP)
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('🔐 Firebase Admin initialized with application default credentials');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    
    // In production, try to initialize without credentials (for demo purposes)
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Firebase initialization failed, trying fallback approach...');
      try {
        // This will use the default project credentials
        admin.initializeApp({
          projectId: 'wellspring-4c4c0'
        });
        console.log('🔐 Firebase Admin initialized with project ID fallback');
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback Firebase initialization also failed:', fallbackError);
      }
    }
    
    throw error;
  }
}

initializeFirebaseAdmin();

export const db = admin.firestore();
