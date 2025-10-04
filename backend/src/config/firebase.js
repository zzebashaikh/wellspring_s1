import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname fix for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

try {
  serviceAccount = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'service-account.json'), 'utf8')
  );
} catch (error) {
  console.error('Failed to load service account:', error);
  console.log('Please ensure service-account.json is in backend/');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const db = admin.firestore();
