import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import { connectDB } from './config/database.js';
import initializeFirestoreData from './scripts/initializeData.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import resourceRoutes from './routes/resources.js';
import allocateRoutes from './routes/allocate.js';
import ambulanceRoutes from './routes/ambulance.js';

const app = express(); // <-- must be first

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'WellSpring Hospital API is running',
    timestamp: new Date().toISOString()
  });
});

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
  console.error('Server error:', err.stack);
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
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server with port conflict handling
const PORT = config.PORT;

const startServer = () => {
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 CORS Origin: ${config.CORS_ORIGIN.join(', ')}`);
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