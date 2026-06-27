const lineupService = require('./lineup.service');

async function getLineups(req, res, next) {
  try {
    const data = await lineupService.getLineups();

    res.json({
      success: true,
      message: 'Lineups retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateLineupSlot(req, res, next) {
  try {
    const data = await lineupService.updateLineupSlot(
      req.params.teamNumber,
      req.params.slotNumber,
      req.body.member_id,
    );

    res.json({
      success: true,
      message: 'Lineup slot updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLineups,
  updateLineupSlot,
};
