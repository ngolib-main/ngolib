const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/ngos', searchController.populateSearchNgos);
router.get('/opportunities', searchController.populateSearchOpportunities);
router.get('/ngos/:id', searchController.getNGOById); // Corrected route

module.exports = router;