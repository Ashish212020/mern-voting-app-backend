const express = require('express');
const router = express.Router();

// We import the controller function we just created.
const { registerUser ,loginUser} = require('../controllers/authController');

// When a POST request is made to '/register', the registerUser function will be executed.
// The full URL will be /api/auth/register because we will prefix '/api/auth' in server.js
router.post('/register', registerUser);
// --- NEW ROUTE ADDED ---
// When a POST request is made to '/login', the loginUser function will be executed.
router.post('/login', loginUser);

// We will add the login route here later.
module.exports = router;