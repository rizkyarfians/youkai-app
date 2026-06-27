const express = require('express');

const router = express.Router();

const dashboardController = require('./dashboard.controller');

router.get('/', dashboardController.getDashboard);
router.get('/members-score', dashboardController.getMemberActivityScores);

module.exports = router;