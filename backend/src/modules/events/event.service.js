async function getFirebaseEvents() {
  const { getFirestore } = require('../../config/firebase');
  const db = getFirestore();
  const [eventTypesSnapshot, eventsSnapshot, attendancesSnapshot] = await Promise.all([
    db.collection('eventTypes').get(),
    db.collection('events').get(),
    db.collection('eventAttendances').get(),
  ]);
  const eventTypes = eventTypesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  const typeLookup = new Map(eventTypes.map((eventType) => [String(eventType.id), eventType]));
  const attendanceCount = new Map();

  attendancesSnapshot.docs.forEach((doc) => {
    const attendance = doc.data();
    const eventId = String(attendance.event_id || attendance.eventId || '');

    if (eventId) {
      attendanceCount.set(eventId, (attendanceCount.get(eventId) || 0) + 1);
    }
  });

  const events = eventsSnapshot.docs
    .map((doc) => {
      const event = {
        id: doc.id,
        ...doc.data(),
      };
      const eventType = typeLookup.get(String(event.event_type_id || event.eventTypeId)) || {};

      return {
        ...event,
        event_type_name: event.event_type_name || eventType.name || '-',
        event_type_slug: event.event_type_slug || eventType.slug || 'event',
        attendance_count: attendanceCount.get(String(event.id)) || 0,
      };
    })
    .sort((first, second) => {
      return String(second.event_date || '').localeCompare(String(first.event_date || ''));
    });

  return {
    eventTypes,
    events,
  };
}

async function createFirebaseEvent(payload) {
  const { getFirestore } = require('../../config/firebase');
  const { findFirebaseMemberRef } = require('../members/member.firebase.helper');
  const db = getFirestore();
  const memberIds = Array.isArray(payload.member_ids) ? payload.member_ids : [];
  const eventRef = db.collection('events').doc();
  const timestamp = new Date().toISOString();
  const batch = db.batch();

  batch.set(eventRef, {
    id: eventRef.id,
    event_type_id: payload.event_type_id,
    title: payload.title,
    event_date: payload.event_date || timestamp.slice(0, 10),
    note: payload.note || null,
    created_at: timestamp,
    updated_at: timestamp,
  });

  memberIds.forEach((memberId) => {
    const attendanceRef = db.collection('eventAttendances').doc(`${eventRef.id}-${memberId}`);
    batch.set(attendanceRef, {
      event_id: eventRef.id,
      member_id: String(memberId),
      created_at: timestamp,
    });
  });

  for (const memberId of memberIds) {
    const memberRef = await findFirebaseMemberRef(db, memberId);

    if (!memberRef) {
      continue;
    }

    const memberDoc = await memberRef.get();
    const currentScore = Number(
      memberDoc.data()?.activity_score ?? memberDoc.data()?.attendance_total ?? 0,
    ) || 0;
    const nextScore = Math.max(0, Math.round(currentScore + 1));

    batch.set(
      memberRef,
      {
        activity_score: nextScore,
        attendance_total: nextScore,
        updated_at: timestamp,
      },
      { merge: true },
    );
  }

  await batch.commit();
}

async function deleteFirebaseEvent(eventId) {
  const { getFirestore } = require('../../config/firebase');
  const { findFirebaseMemberRef } = require('../members/member.firebase.helper');
  const db = getFirestore();
  const eventRef = db.collection('events').doc(String(eventId));
  const attendances = await db
    .collection('eventAttendances')
    .where('event_id', '==', String(eventId))
    .get();
  const batch = db.batch();

  batch.delete(eventRef);
  attendances.docs.forEach((doc) => batch.delete(doc.ref));

  for (const doc of attendances.docs) {
    const memberId = doc.data().member_id;
    const memberRef = await findFirebaseMemberRef(db, memberId);

    if (!memberRef) {
      continue;
    }

    const memberDoc = await memberRef.get();
    const currentScore = Number(
      memberDoc.data()?.activity_score ?? memberDoc.data()?.attendance_total ?? 0,
    ) || 0;
    const nextScore = Math.max(0, Math.round(currentScore - 1));

    batch.set(
      memberRef,
      {
        activity_score: nextScore,
        attendance_total: nextScore,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  await batch.commit();
}

function validateEventPayload(payload) {
  if (!payload.title || !payload.event_type_id) {
    const error = new Error('Event title and type are required');
    error.statusCode = 400;
    throw error;
  }
}

async function getEvents() {
  return getFirebaseEvents();
}

async function createEvent(payload) {
  validateEventPayload(payload);
  await createFirebaseEvent(payload);

  return getEvents();
}

async function deleteEvent(eventId) {
  await deleteFirebaseEvent(eventId);

  return getEvents();
}

module.exports = {
  createEvent,
  deleteEvent,
  getEvents,
};
