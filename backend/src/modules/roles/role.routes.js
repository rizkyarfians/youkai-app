const express = require('express');

const router = express.Router();
const roleController = require('./role.controller');

router.get('/', roleController.getRoles);

module.exports = router;
