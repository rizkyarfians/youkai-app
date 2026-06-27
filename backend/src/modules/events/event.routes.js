const express = require('express');

const eventController = require('./event.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', eventController.getEvents);
router.post('/', authenticate, requireRole('admin'), eventController.createEvent);
router.delete('/:id', authenticate, requireRole('admin'), eventController.deleteEvent);

module.exports = router;
