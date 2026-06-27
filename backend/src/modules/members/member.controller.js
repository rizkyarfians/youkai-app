const memberService = require('./member.service');

async function getMembers(req, res, next) {
  try {
    const members = await memberService.getMembers();

    res.json({
      success: true,
      message: 'Members retrieved successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

async function createMember(req, res, next) {
  try {
    const members = await memberService.createMember(req.body);

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMember(req, res, next) {
  try {
    const members = await memberService.updateMember(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

async function updateMemberStatus(req, res, next) {
  try {
    const members = await memberService.updateMemberStatus(
      req.params.id,
      req.body.status,
    );

    res.json({
      success: true,
      message: 'Member status updated successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

async function adjustMemberActivityScore(req, res, next) {
  try {
    const members = await memberService.adjustMemberActivityScore(
      req.params.id,
      req.body.delta,
    );

    res.json({
      success: true,
      message: 'Member activity score updated successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMember(req, res, next) {
  try {
    const members = await memberService.deleteMember(req.params.id);

    res.json({
      success: true,
      message: 'Member deleted successfully',
      data: members,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  adjustMemberActivityScore,
  createMember,
  deleteMember,
  getMembers,
  updateMember,
  updateMemberStatus,
};
