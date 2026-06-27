const roleService = require('./role.service');

async function getRoles(req, res, next) {
  try {
    const roles = await roleService.getRoles();

    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRoles,
};
