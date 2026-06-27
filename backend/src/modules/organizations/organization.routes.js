const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Organization route is ready',
    data: [],
  });
});

module.exports = router;