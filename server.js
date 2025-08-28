// FILE: server/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Import local modules
const connectDB = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');
const surveyRoutes = require('./routes/surveyRoutes.js');

// Initial setup
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// --- Production-Ready CORS Configuration ---
// This list contains the URLs that are allowed to make requests to your API.
const allowedOrigins = [
    'http://localhost:5173', // For local development
     'https://mern-survery-app-frontend.onrender.com' // TODO: Add your live frontend URL here after deploying it
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};

// Initialize Socket.IO with the CORS options
const io = new Server(server, { cors: corsOptions });

// Use the CORS options for all Express routes
app.use(cors(corsOptions));

// Standard Middleware
app.use(express.json());

// Middleware to attach Socket.IO to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);

// --- Static File Serving ---
// Make the 'uploads' folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Server Startup
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
