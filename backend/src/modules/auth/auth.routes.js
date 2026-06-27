const express = require('express');

const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.get('/health', authController.health);
router.get('/me', authenticate, authController.me);

module.exports = router;
