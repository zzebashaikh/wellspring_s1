// routes/auth.js
import express from 'express';
import { config } from '../config/environment.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Authentication service is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Note: Authentication is handled via Firebase
// Frontend logs in via Firebase Auth and sends Firebase ID tokens
// Backend middleware verifies Firebase ID tokens automatically

export default router;
