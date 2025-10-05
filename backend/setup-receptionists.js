// setup-receptionists.js
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Receptionist data - customize these as needed
const receptionists = [
  {
    email: 'receptionist@wellspring.com',
    password: 'demo123',
    displayName: 'Demo Receptionist'
  },
  {
    email: 'pooja@wellspring.com',
    password: 'wellspring123',
    displayName: 'Pooja Sharma'
  },
  {
    email: 'aisha@wellspring.com', 
    password: 'wellspring123',
    displayName: 'Aisha Khan'
  },
  {
    email: 'priya@wellspring.com',
    password: 'wellspring123', 
    displayName: 'Priya Patel'
  },
  {
    email: 'meera@wellspring.com',
    password: 'wellspring123',
    displayName: 'Meera Singh'
  },
  {
    email: 'kavya@wellspring.com',
    password: 'wellspring123',
    displayName: 'Kavya Gupta'
  },
  {
    email: 'john@wellspring.com',
    password: 'wellspring123',
    displayName: 'John Smith'
  },
  {
    email: 'sarah@wellspring.com',
    password: 'wellspring123',
    displayName: 'Sarah Johnson'
  },
  {
    email: 'michael@wellspring.com',
    password: 'wellspring123',
    displayName: 'Michael Brown'
  }
];

console.log('Setting up receptionist accounts...');

for (const receptionist of receptionists) {
  try {
    const userRecord = await admin.auth().createUser({
      email: receptionist.email,
      password: receptionist.password,
      displayName: receptionist.displayName,
      disabled: false
    });
    
    console.log(`✅ Created receptionist: ${receptionist.displayName} (${receptionist.email})`);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'receptionist',
      permissions: ['read:patients', 'write:patients', 'allocate:resources']
    });
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  Receptionist already exists: ${receptionist.email}`);
    } else {
      console.error(`❌ Error creating ${receptionist.email}:`, error.message);
    }
  }
}

console.log('\n🎉 Receptionist setup complete!');
console.log('\n📋 Login Credentials:');
receptionists.forEach(r => {
  console.log(`   ${r.displayName}: ${r.email} | password: receptionist123`);
});

process.exit(0);
