const dashboardService = require('./dashboard.service');

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboardData();

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function getMemberActivityScores(req, res, next) {
  try {
    const members = await dashboardService.getMemberActivityScores();

    res.json({
      success: true,
      message: 'Member activity scores retrieved successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  getMemberActivityScores,
};
