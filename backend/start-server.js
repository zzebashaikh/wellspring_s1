#!/usr/bin/env node
// start-server.js - Smart server starter with port conflict resolution

import { spawn } from 'child_process';
import net from 'net';

const PORT = process.env.PORT || 3001;

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    
    server.on('error', () => resolve(false));
  });
}

// Kill process using port
async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    
    if (process.platform === 'win32') {
      const child = spawn('cmd', ['/c', `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /f /pid %a`], { shell: true });
      child.on('exit', resolve);
    } else {
      const child = spawn('sh', ['-c', `lsof -ti:${port} | xargs kill -9`]);
      child.on('exit', resolve);
    }
  });
}

async function startServer() {
  console.log('🏥 WellSpring Hospital - Backend Server');
  console.log('=====================================');
  
  // Check if port is available
  const available = await isPortAvailable(PORT);
  
  if (!available) {
    console.log(`⚠️  Port ${PORT} is already in use. Attempting to free it...`);
    
    try {
      await killProcessOnPort(PORT);
      console.log(`✅ Freed port ${PORT}`);
    } catch (error) {
      console.log(`❌ Could not free port ${PORT}. Trying alternative ports...`);
      
      const alternatives = [3002, 3003, 3004, 8080];
      let foundPort = false;
      
      for (const altPort of alternatives) {
        if (await isPortAvailable(altPort)) {
          console.log(`✅ Using alternative port: ${altPort}`);
          process.env.PORT = altPort;
          foundPort = true;
          break;
        }
      }
      
      if (!foundPort) {
        console.log('❌ No available ports found. Please restart manually.');
        process.exit(1);
      }
    }
  } else {
    console.log(`✅ Port ${PORT} is available`);
  }
  
  // Start the server
  console.log(`🚀 Starting backend server...`);
  const server = spawn('node', ['src/server.js'], { 
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    if (code !== 0) {
      process.exit(code);
    }
  });
}

startServer();
