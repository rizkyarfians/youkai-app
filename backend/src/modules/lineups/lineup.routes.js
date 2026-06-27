const express = require('express');

const lineupController = require('./lineup.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', lineupController.getLineups);
router.put(
  '/:teamNumber/:slotNumber',
  authenticate,
  requireRole('admin'),
  lineupController.updateLineupSlot,
);

module.exports = router;
