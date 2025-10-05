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
    throw error;
  }
}

initializeFirebaseAdmin();

export const db = admin.firestore();
