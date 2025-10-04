// middleware/auth.js
import admin from 'firebase-admin';
import { config } from '../config/environment.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Development mode: allow requests with no token or demo token prefixes
    if (config.NODE_ENV === 'development') {
      const isDemoToken = token && token.startsWith('demo-token');
      if (!token || isDemoToken) {
        req.user = {
          uid: 'demo-user',
          email: 'receptionist@wellspring.com',
          role: 'receptionist',
          permissions: ['read:patients', 'write:patients', 'allocate:resources'],
        };
        return next();
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    // Check if it's a demo token first (before Firebase verification)
    if (config.NODE_ENV === 'development' && token.startsWith('demo-token')) {
      req.user = {
        uid: 'demo-user',
        email: 'receptionist@wellspring.com',
        role: 'receptionist',
        permissions: ['read:patients', 'write:patients', 'allocate:resources'],
      };
      return next();
    }

    // Verify Firebase ID token (production and non-demo tokens)
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: 'receptionist',
      };
      
      next();
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError);
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    const message = config.NODE_ENV === 'development' ? `Authentication error: ${error.message}` : 'Authentication failed';
    return res.status(403).json({ 
      success: false,
      message
    });
  }
};