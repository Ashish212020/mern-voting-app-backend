// FILE: server/controllers/authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- THIS IS THE FUNCTION TO UPDATE ---
const generateToken = (user) => {
  // Instead of just passing the ID, we'll pass an object with the data we need.
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: '30d',
    }
  );
};

// --- UPDATE THE CONTROLLERS TO PASS THE WHOLE USER OBJECT ---

// @desc    Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name, email, password, role });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user), // Pass the whole user object
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token (Login)
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user), // Pass the whole user object
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerUser, loginUser };
