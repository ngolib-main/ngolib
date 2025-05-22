//opportuntityRoutes.js
const express = require('express');
const router = express.Router();
const {
    createOpportunity,
    getAllOpportunities
} = require('../controllers/opportunityController');


// POST /api/opportunities
router.post('/postOpportunity', createOpportunity);

// GET /api/opportunities
router.get('/opportunities', getAllOpportunities);

module.exports = router;