const express = require('express');

const router = express.Router();
const memberController = require('./member.controller');
const { authenticate, requireRole } = require('../../middlewares/auth.middleware');

router.get('/', memberController.getMembers);
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  memberController.createMember,
);
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  memberController.updateMember,
);
router.put(
  '/:id/status',
  authenticate,
  requireRole('admin'),
  memberController.updateMemberStatus,
);
router.put(
  '/:id/score',
  authenticate,
  requireRole('admin'),
  memberController.adjustMemberActivityScore,
);
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  memberController.deleteMember,
);

module.exports = router;
