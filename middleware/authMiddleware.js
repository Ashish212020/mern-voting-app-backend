const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @desc    This middleware protects routes by checking for a valid JWT.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the request has an Authorization header that starts with "Bearer".
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. If it exists, extract the token (the part after "Bearer ").
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using our JWT_SECRET. This decodes the token's payload.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user in the database using the ID from the decoded token.
      // We attach the user object to the request (`req.user`) but exclude the password.
      req.user = await User.findById(decoded.id).select('-password');
      
      // 5. Call `next()` to pass control to the next function in the chain (e.g., the admin middleware or the controller).
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * @desc    This middleware restricts access to admin users only.
 * @note    It should ALWAYS be used AFTER the `protect` middleware.
 */
const admin = (req, res, next) => {
  // 1. Check if the `req.user` object exists (from the `protect` middleware) and if that user's role is 'admin'.
  if (req.user && req.user.role === 'admin') {
    // 2. If they are an admin, call `next()` to proceed.
    next();
  } else {
    // 3. If not, send a 401 Unauthorized error.
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };