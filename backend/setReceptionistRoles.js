import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read service account JSON
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const receptionists = [
  'aisha.khan@wellspring.com',
  'neha.patel@wellspring.com',
  'rohan.desai@wellspring.com',
  'amit.verma@wellspring.com',
  'radhika.menon@wellspring.com',
  'meera.iyer@wellspring.com'
];

async function assignRoles() {
  for (const email of receptionists) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { role: 'receptionist' });
      console.log(`Assigned role 'receptionist' to ${email}`);
    } catch (err) {
      console.error(`Error assigning role to ${email}:`, err);
    }
  }
  console.log('All roles assigned.');
  process.exit(0);
}

assignRoles();
