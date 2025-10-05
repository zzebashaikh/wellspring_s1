// config/environment.js
import 'dotenv/config';

// Parse CORS origins from environment variable or use defaults
export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'wellspring_hospital_jwt_secret_2024',
  // Allow demo auth tokens outside development if explicitly enabled
  DEMO_AUTH_ALLOWED: (process.env.DEMO_AUTH_ALLOWED || 'false').toLowerCase() === 'true',
  // Dynamic CORS origins - parse from env or use defaults
  CORS_ORIGIN: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : [
        'http://localhost:5173',    // Vite default
        'http://localhost:8081',    // Current frontend port  
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8081',
        'http://localhost:8083',   // Additional dev port
        'https://wellspringhospital.netlify.app'  // Production frontend
      ],
};