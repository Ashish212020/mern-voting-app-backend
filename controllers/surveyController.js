    // FILE: server/controllers/surveyController.js

    const Survey = require('../models/Survey');
    const sendEmail = require('../utils/sendEmail.js'); 

    /**
     * @desc    Create a new survey
     * @route   POST /api/surveys
     * @access  Private/Admin
     */
    const createSurvey = async (req, res) => {
  try {
    // Add `resultsVisible` to the destructured properties
    const { title, description, options, deadline, category, resultsVisible } = req.body;
    
    const survey = new Survey({
      title, description, category, deadline,
      resultsVisible: resultsVisible || false, // Add the visibility setting
      options: options.map(opt => ({ optionText: opt, votes: 0 })),
      createdBy: req.user._id,
    });

    const createdSurvey = await survey.save();
    req.io.emit('newSurvey', createdSurvey);
    res.status(201).json(createdSurvey);
  } catch (error) {
    res.status(400).json({ message: 'Error creating survey' });
  }
};

const toggleResultsVisibility = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        // Security check: Only the creator can change the visibility
        if (survey.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Flip the boolean value
        survey.resultsVisible = !survey.resultsVisible;
        const updatedSurvey = await survey.save();
        
        // Emit a real-time event so any open detail pages get updated
        req.io.emit('voteUpdate', updatedSurvey);

        res.json(updatedSurvey);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


/// --- NEW FUNCTION ADDED --- /
/**
 * @desc    Get all surveys that are currently active
 * @route   GET /api/surveys/active
 * @access  Public
 */
const getActiveSurveys = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        // --- FILTERING LOGIC ---
        // Start with a base filter for active surveys
        const filter = { deadline: { $gt: new Date() } };
        // If a category is provided in the query URL (e.g., /surveys/active?category=Technology),
        // add it to our filter object.
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }

        const totalSurveys = await Survey.countDocuments(filter);

        // Use the filter object in our find() query
        const surveys = await Survey.find(filter)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);

        res.json({
            surveys,
            currentPage: page,
            totalPages: Math.ceil(totalSurveys / limit),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION ADDED ---
/**
 * @desc    Cast a vote on a specific survey
 * @route   POST /api/surveys/:id/vote
 * @access  Private
 */
const castVote = async (req, res) => {
  const { optionId } = req.body;
  try {
    const survey = await Survey.findById(req.params.id);

    // ... (all the existing validation checks for voting)
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    if (survey.deadline < new Date()) return res.status(400).json({ message: 'This survey has already expired.' });
    if (survey.voters.includes(req.user._id)) return res.status(400).json({ message: 'You have already voted in this survey.' });
    
    const option = survey.options.id(optionId);
    if (!option) return res.status(404).json({ message: 'Invalid voting option.' });

    option.votes++;
    survey.voters.push(req.user._id);
    const updatedSurvey = await survey.save();

    req.io.emit('voteUpdate', updatedSurvey);
    
    // --- 2. SEND THE CONFIRMATION EMAIL ---
    try {
      await sendEmail({
        email: req.user.email, // The email of the logged-in user
        subject: 'Your Vote Has Been Recorded!',
        html: `
          <h1>Thank you for participating!</h1>
          <p>This is a confirmation that your vote for the survey titled "<b>${survey.title}</b>" has been successfully recorded.</p>
          <p>You voted for the option: "<b>${option.optionText}</b>".</p>
          <p>Thank you for making your voice heard!</p>
          <br>
          <p><em>- The VoteHub Team</em></p>
        `,
      });
    } catch (emailError) {
      // Log the error, but don't stop the user's request from succeeding
      // even if the email fails to send.
      console.error('Could not send confirmation email:', emailError);
    }

    res.json(updatedSurvey);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- NEW FUNCTION ADDED ---
/**
 * @desc    Get a single survey by its ID
 * @route   GET /api/surveys/:id
 * @access  Public (for now, we'll protect it later if needed)
 */
const getSurveyById = async (req, res) => {
  try {
    // Find the survey by the ID provided in the URL parameter.
    const survey = await Survey.findById(req.params.id).populate('createdBy', 'name');

    if (survey) {
      res.json(survey);
    } else {
      // If no survey is found with that ID, send a 404 error.
      res.status(404).json({ message: 'Survey not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

    // --- NEW FUNCTION 1: GET ADMIN SURVEYS ---
/**
 * @desc    Get all surveys created by the logged-in admin
 * @route   GET /api/surveys/admin
 * @access  Private/Admin
 */
const getAdminSurveys = async (req, res) => {
    try {
        // Find all surveys where 'createdBy' matches the logged-in admin's ID.
        const surveys = await Survey.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 }); // Sort newest first
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION 2: DELETE SURVEY ---
/**
 * @desc    Delete a survey
 * @route   DELETE /api/surveys/:id
 * @access  Private/Admin
 */
const deleteSurvey = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        // Security check: Make sure the user trying to delete the survey is the one who created it.
        if (survey.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await survey.deleteOne();

        // Emit a real-time event so the UI can update
        req.io.emit('surveyDeleted', req.params.id);

        res.json({ message: 'Survey removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getExpiredSurveys = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 3; // Show 3 expired surveys per page
        const skip = (page - 1) * limit;

        // The only change is here: we look for deadlines less than ($lt) the current date.
        const filter = { deadline: { $lt: new Date() } };

        const totalSurveys = await Survey.countDocuments(filter);

        const surveys = await Survey.find(filter)
            .populate('createdBy', 'name')
            .sort({ deadline: -1 }) // Show the most recently ended surveys first
            .limit(limit)
            .skip(skip);

        res.json({
            surveys,
            currentPage: page,
            totalPages: Math.ceil(totalSurveys / limit),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const closeSurvey = async (req, res) => {
    try {
        const survey = await Survey.findById(req.params.id);

        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }
        // Security check: Only the creator can close the survey
        if (survey.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        // Set the deadline to the current time, effectively closing the poll.
        survey.deadline = new Date();
        const updatedSurvey = await survey.save();

        // Emit real-time events to update all connected clients
        // This event tells the homepage to remove the card from the "Active" list
        req.io.emit('surveyDeleted', updatedSurvey._id);
        // This event tells the homepage to refetch the "Expired" list
        req.io.emit('surveyClosed');

        res.json(updatedSurvey);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// Add the new function to the exports
module.exports = { 
  createSurvey, 
  getActiveSurveys, 
  castVote, 
  getSurveyById,
  getAdminSurveys,
  deleteSurvey,
  toggleResultsVisibility,
  getExpiredSurveys,
  closeSurvey
};
