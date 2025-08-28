// FILE: server/models/Survey.js

const mongoose = require('mongoose');

// This is a "sub-schema". It defines the structure for each individual voting option
// within a survey. We don't create a separate model for it.
const OptionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const SurveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a survey title or question'],
  },
  description: {
    type: String,
  },
  // We'll add the image field later to keep things simple for now.
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Technology', 'Lifestyle', 'Entertainment', 'General', 'Politics'], // The list of allowed categories
    default: 'General',
  },
  resultsVisible: {
    type: Boolean,
    default: false, // By default, results are hidden.
  },
  options: [OptionSchema], // This will be an array of options, each following the OptionSchema structure.
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, // This stores the unique ID of a document.
    required: true,
    ref: 'User', // This creates a reference to the 'User' model. It links the survey to the admin who created it.
  },
  deadline: {
    type: Date,
    required: [true, 'Please set a deadline for the survey'],
  },
  // This array will store the IDs of users who have voted, to prevent them from voting more than once.
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Survey', SurveySchema);
