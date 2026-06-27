function health(req, res) {
  res.json({
    success: true,
    message: 'Auth route is ready',
  });
}

function me(req, res) {
  res.json({
    success: true,
    message: 'Authenticated profile retrieved successfully',
    data: req.user,
  });
}

module.exports = {
  health,
  me,
};
