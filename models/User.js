const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This is the blueprint for our user data in the MongoDB database.
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'], // This field is mandatory.
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true, // No two users can have the same email.
    match: [/.+\@.+\..+/, 'Please enter a valid email address'], // Basic email format validation.
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // The role can only be 'user' or 'admin'.
    default: 'user', // If no role is specified, it defaults to 'user'.
  },
}, {
  timestamps: true // This automatically adds `createdAt` and `updatedAt` fields.
});

// This is a "pre-save hook". Before a user document is saved, this function will run.
UserSchema.pre('save', async function (next) {
  // We only want to hash the password if it's new or has been changed.
  if (!this.isModified('password')) {
    return next();
  }

  // "Salting" adds random characters to the password before hashing to make it more secure.
  const salt = await bcrypt.genSalt(10);
  // Now we hash the password with the salt.
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- NEW METHOD ADDED ---
// This method will be available on any user document we retrieve from the database.
// It uses bcrypt's `compare` function, which securely compares a plain-text password
// with a hashed one without ever exposing the hash.
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);