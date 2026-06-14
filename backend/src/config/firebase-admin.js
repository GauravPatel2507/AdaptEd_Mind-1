// Firebase Admin SDK initialization
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const config = require('./index');

// Initialize Firebase Admin
// In production: set GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
// In development: uses Application Default Credentials or service account file
if (!admin.apps.length) {
  const initOptions = {
    projectId: config.firebase.projectId,
  };

  if (config.firebase.databaseURL) {
    initOptions.databaseURL = config.firebase.databaseURL;
  }

  // If a service account key file is available, use it
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    try {
      const resolvedPath = path.resolve(credentialsPath);
      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        initOptions.credential = admin.credential.cert(serviceAccount);
        console.log('[Firebase Admin] Initialized with service account credentials');
      } else {
        console.warn(`[Firebase Admin] Service account file not found: ${resolvedPath}`);
        console.warn('[Firebase Admin] Falling back to application default credentials');
      }
    } catch (error) {
      console.error('[Firebase Admin] Error loading service account:', error.message);
    }
  } else {
    console.log('[Firebase Admin] No GOOGLE_APPLICATION_CREDENTIALS set - using default credentials');
    console.log('[Firebase Admin] Token verification will work if running on Google Cloud,');
    console.log('[Firebase Admin] otherwise set GOOGLE_APPLICATION_CREDENTIALS in .env');
  }

  admin.initializeApp(initOptions);
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

module.exports = { admin, adminDb, adminAuth };

