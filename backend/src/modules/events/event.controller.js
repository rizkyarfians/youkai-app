const eventService = require('./event.service');

async function getEvents(req, res, next) {
  try {
    const data = await eventService.getEvents();

    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function createEvent(req, res, next) {
  try {
    const data = await eventService.createEvent(req.body);

    res.json({
      success: true,
      message: 'Event created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const data = await eventService.deleteEvent(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvent,
  deleteEvent,
  getEvents,
};
