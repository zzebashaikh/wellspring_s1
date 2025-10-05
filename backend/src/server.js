import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import initializeFirestoreData from './scripts/initializeData.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple structured logger
const log = {
  info: (message, meta = {}) => console.log(JSON.stringify({ level: 'info', message, ...meta })),
  warn: (message, meta = {}) => console.warn(JSON.stringify({ level: 'warn', message, ...meta })),
  error: (message, meta = {}) => console.error(JSON.stringify({ level: 'error', message, ...meta })),
};

// Async route wrapper
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Import routes
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import resourceRoutes from './routes/resources.js';
import allocateRoutes from './routes/allocate.js';
import ambulanceRoutes from './routes/ambulance.js';

const app = express(); // <-- must be first

// Firestore is initialized in config/firebase.js; no MongoDB connection is used.

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request/response logging middleware
app.use((req, res, next) => {
  const startTimeMs = Date.now();
  const authHeader = req.headers['authorization'];
  const hasToken = Boolean(authHeader);
  const tokenType = hasToken && authHeader.split(' ')[0];
  log.info('request', { method: req.method, url: req.originalUrl, token: hasToken ? tokenType : 'none', ip: req.ip });
  if (Object.keys(req.body || {}).length > 0) {
    log.info('request_body', { body: req.body });
  }
  res.on('finish', () => {
    const durationMs = Date.now() - startTimeMs;
    log.info('response', { method: req.method, url: req.originalUrl, statusCode: res.statusCode, durationMs });
  });
  next();
});

// CORS
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.options('*', cors({ origin: config.CORS_ORIGIN, credentials: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/allocate', allocateRoutes);
app.use('/api/ambulance', ambulanceRoutes);

// Health check endpoint
app.get('/api/health', asyncHandler(async (req, res) => {
  res.json({ status: 'ok' });
}));

// Serve frontend in production
if (config.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDist = path.resolve(__dirname, '../../frontend/dist');

  app.use(express.static(clientDist));

  // Fallback to index.html for client-side routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  log.error('server_error', { stack: err.stack, message: err.message });
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Process error handling
process.on('uncaughtException', (err) => {
  log.error('uncaught_exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  log.error('unhandled_rejection', { message: err && err.message, stack: err && err.stack });
  process.exit(1);
});

// Start server with port conflict handling
const PORT = config.PORT;

const startServer = () => {
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    try {
      const corsOrigins = Array.isArray(config.CORS_ORIGIN) ? config.CORS_ORIGIN.join(', ') : String(config.CORS_ORIGIN);
      console.log(`🔗 CORS Origin: ${corsOrigins}`);
    } catch {
      console.log('🔗 CORS Origin: (unavailable)');
    }
    console.log(`🏥 WellSpring Hospital API is ready!`);
    
    // Initialize Firestore data
    try {
      await initializeFirestoreData();
    } catch (error) {
      console.log('⚠️  Firestore data initialization skipped:', error.message);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.log(`🔧 Attempting to find available port...`);
      
      // Try alternative ports
      const alternativePorts = [3002, 3003, 3004, 8080, 8000];
      tryAlternativePort(alternativePorts, 0);
    } else {
      console.error('❌ Server error:', error);
    }
  });

  return server;
};

const tryAlternativePort = (ports, index) => {
  if (index >= ports.length) {
    console.error('❌ No available ports found! Please free port 3001 and restart.');
    process.exit(1);
  }

  const newPort = ports[index];
  console.log(`🔄 Trying port ${newPort}...`);
  
  const server = app.listen(newPort, () => {
    console.log(`✅ Server running on alternative port ${newPort}`);
    console.log(`🔗 Update your frontend to use: http://localhost:${newPort}/api`);
    console.log(`🏥 WellSpring Hospital API is ready!`);
  });

  server.on('error', () => {
    tryAlternativePort(ports, index + 1);
  });
};

// Start the server
startServer();