// Create Admin User Script
// Run this script to create an admin user

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    const email = 'admin@assignmentpro.com';
    const password = 'admin123456';
    
    console.log('Creating admin user...');
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('User created with UID:', user.uid);
    
    // Create admin profile
    await setDoc(doc(db, 'profiles', user.uid), {
      full_name: 'Admin User',
      email: email,
      phone: '1234567890',
      role: 'admin',
      is_approved: true,
      total_earnings: 0,
      created_at: new Date().toISOString()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', user.uid);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
