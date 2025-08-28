// FILE: server/routes/surveyRoutes.js

const express = require('express');

const router = express.Router();
// Import the new functions
const { 
  createSurvey, 
  getActiveSurveys, 
  castVote, 
  getSurveyById,
  getAdminSurveys,
  deleteSurvey,
  toggleResultsVisibility,
  getExpiredSurveys,
  closeSurvey
} = require('../controllers/surveyController');
const { protect, admin } = require('../middleware/authMiddleware');

 

    // --- Update the Create Survey Route ---
    // Add `upload.single('image')` as middleware. 'image' must match the field name in the form data.
router.route('/').post(protect, admin, createSurvey);
router.route('/active').get(getActiveSurveys);
router.route('/admin').get(protect, admin, getAdminSurveys);

// Add the new /expired route here, BEFORE the routes with /:id
router.route('/expired').get(getExpiredSurveys); 

// Routes with a URL parameter like /:id must come AFTER more specific routes.
router.route('/:id')
  .get(getSurveyById)
  .delete(protect, admin, deleteSurvey);

router.route('/:id/vote').post(protect, castVote);
router.route('/:id/close').patch(protect, admin, closeSurvey);
router.route('/:id/toggle-visibility').patch(protect, admin, toggleResultsVisibility);

module.exports = router;
