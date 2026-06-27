const dashboardService = require('../dashboard/dashboard.service');
const { defaultJobs } = require('../../data/defaultData');

const memberStatuses = [
  'active',
  'inactive',
  'toon',
  'observation',
  'bye-bye',
  'poor-attendance',
];

const memberPositions = [
  'Guild Master',
  'Vice Guild Master',
  'Commander',
  'Charisma Baby',
  'Officer',
  'Kumo',
  'Noroi',
  'Member',
  'NEW',
];

const positionAliases = {
  leader: 'Guild Master',
  'guild master': 'Guild Master',
  vice: 'Vice Guild Master',
  'vice guild master': 'Vice Guild Master',
  commander: 'Commander',
  'charisma baby': 'Charisma Baby',
  officer: 'Officer',
  kumo: 'Kumo',
  noroi: 'Noroi',
  member: 'Member',
  new: 'NEW',
};

const NEW_POSITION_DAYS = 7;

function chunk(records, size) {
  const chunks = [];

  for (let index = 0; index < records.length; index += size) {
    chunks.push(records.slice(index, index + size));
  }

  return chunks;
}

function nowIso() {
  return new Date().toISOString();
}

function memberDocId(memberId) {
  return `member-${String(memberId).padStart(3, '0')}`;
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertValidStatus(status) {
  if (!memberStatuses.includes(status)) {
    throw createError(`Invalid member status: ${status}`);
  }
}

function normalizeRequiredText(value, label) {
  const text = String(value || '').trim();

  if (!text) {
    throw createError(`${label} is required`);
  }

  return text;
}

function normalizeOptionalText(value, fallback = '') {
  const text = String(value || '').trim();

  return text || fallback;
}

function normalizePosition(value) {
  const rawValue = String(value || 'Member').trim();
  const normalized = positionAliases[rawValue.toLowerCase()];

  if (!normalized) {
    throw createError(`Invalid member position: ${value}`);
  }

  return normalized;
}

function getPositionAgeSource(member) {
  return (
    member.position_started_at ||
    member.positionStartedAt ||
    member.created_at ||
    member.createdAt ||
    member.imported_at ||
    member.importedAt ||
    member.updated_at ||
    member.updatedAt ||
    null
  );
}

function isExpiredNewPosition(member, nowMs = Date.now()) {
  if (normalizePosition(member.position) !== 'NEW') {
    return false;
  }

  const ageSource = getPositionAgeSource(member);

  if (!ageSource) {
    return false;
  }

  const startedAt = Date.parse(ageSource);

  if (Number.isNaN(startedAt)) {
    return false;
  }

  return nowMs - startedAt >= NEW_POSITION_DAYS * 24 * 60 * 60 * 1000;
}

function findJob(value) {
  const normalized = String(value || '').trim().toLowerCase();

  return defaultJobs.find((job) => {
    return (
      String(job.id) === normalized ||
      job.slug === normalized ||
      job.name.toLowerCase() === normalized
    );
  });
}

function assertValidJob(value) {
  const job = findJob(value);

  if (!job) {
    throw createError(`Invalid member job: ${value}`);
  }

  return job;
}

function buildJobFields(job) {
  return {
    source_job: job.name,
    job_id: job.id,
    job_name: job.name,
    job_slug: job.slug,
    job_icon: job.icon || job.slug,
  };
}

function normalizeScore(value, fallback = 0) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return fallback;
  }

  return Math.max(0, Math.round(score));
}

async function getMembers() {
  const { getFirestore } = require('../../config/firebase');
  await promoteExpiredNewMembers(getFirestore());

  return dashboardService.getMemberActivityScores();
}

async function promoteExpiredNewMembers(db) {
  const snapshot = await db.collection('members').get();
  const timestamp = nowIso();
  const expiredMembers = snapshot.docs.filter((doc) => {
    try {
      return isExpiredNewPosition(doc.data());
    } catch {
      return false;
    }
  });

  for (const recordsChunk of chunk(expiredMembers, 400)) {
    const batch = db.batch();

    recordsChunk.forEach((doc) => {
      batch.set(
        doc.ref,
        {
          position: 'Member',
          position_started_at: null,
          updated_at: timestamp,
        },
        { merge: true },
      );
    });

    await batch.commit();
  }
}

async function getNextMemberId(db) {
  const snapshot = await db.collection('members').get();
  const usedIds = new Set();
  let maxId = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const id = Number(data.id);

    if (Number.isInteger(id) && id > 0) {
      usedIds.add(id);
      maxId = Math.max(maxId, id);
    }
  });

  let nextId = maxId + 1;

  while (usedIds.has(nextId)) {
    nextId += 1;
  }

  return nextId;
}

async function createMember(payload) {
  const { getFirestore } = require('../../config/firebase');
  const db = getFirestore();
  const timestamp = nowIso();
  const memberId = await getNextMemberId(db);
  const job = assertValidJob(payload.job_slug || payload.job_id || payload.job_name);
  const status = payload.status || 'active';
  const position = normalizePosition(payload.position);

  assertValidStatus(status);

  const member = {
    id: memberId,
    nickname: normalizeRequiredText(payload.nickname || payload.name, 'Nickname'),
    position,
    position_started_at: position === 'NEW' ? timestamp : null,
    status,
    remark: normalizeOptionalText(payload.remark, null),
    ...buildJobFields(job),
    activity_score: Number(payload.activity_score || 0) || 0,
    attendance_total: Number(payload.attendance_total || 0) || 0,
    attendance_may: Number(payload.attendance_may || 0) || 0,
    attendance_june: Number(payload.attendance_june || 0) || 0,
    attendance: {},
    source: {
      type: 'manual',
    },
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.collection('members').doc(memberDocId(memberId)).set(member);

  return getMembers();
}

async function updateMember(memberId, payload) {
  const { getFirestore } = require('../../config/firebase');
  const db = getFirestore();
  const { findFirebaseMemberRef } = require('./member.firebase.helper');
  const memberRef = await findFirebaseMemberRef(db, memberId);

  if (!memberRef) {
    throw createError('Member not found', 404);
  }

  const updates = {
    updated_at: nowIso(),
  };

  if (Object.prototype.hasOwnProperty.call(payload, 'nickname')) {
    updates.nickname = normalizeRequiredText(payload.nickname, 'Nickname');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'position')) {
    updates.position = normalizePosition(payload.position);
    updates.position_started_at = updates.position === 'NEW' ? nowIso() : null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'remark')) {
    updates.remark = normalizeOptionalText(payload.remark, null);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    assertValidStatus(payload.status);
    updates.status = payload.status;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'activity_score')) {
    updates.activity_score = normalizeScore(payload.activity_score);
    updates.attendance_total = updates.activity_score;
  }

  const jobValue = payload.job_slug || payload.job_id || payload.job_name;

  if (jobValue) {
    Object.assign(updates, buildJobFields(assertValidJob(jobValue)));
  }

  await memberRef.set(updates, { merge: true });

  return getMembers();
}

async function updateMemberStatus(memberId, status) {
  return updateMember(memberId, { status });
}

async function adjustMemberActivityScore(memberId, delta) {
  const { getFirestore } = require('../../config/firebase');
  const db = getFirestore();
  const { findFirebaseMemberRef } = require('./member.firebase.helper');
  const memberRef = await findFirebaseMemberRef(db, memberId);

  if (!memberRef) {
    throw createError('Member not found', 404);
  }

  const step = Number(delta);

  if (!Number.isFinite(step) || !Number.isInteger(step)) {
    throw createError('Score delta must be an integer');
  }

  const memberDoc = await memberRef.get();
  const currentScore = normalizeScore(
    memberDoc.data()?.activity_score ?? memberDoc.data()?.attendance_total,
  );
  const nextScore = normalizeScore(currentScore + step);

  await memberRef.set(
    {
      activity_score: nextScore,
      attendance_total: nextScore,
      updated_at: nowIso(),
    },
    { merge: true },
  );

  return getMembers();
}

function addDocToMap(map, doc) {
  map.set(doc.ref.path, doc);
}

async function queryDocsByMemberIds(collection, fieldName, memberIds) {
  const docs = new Map();

  for (const memberId of memberIds) {
    const snapshot = await collection.where(fieldName, '==', memberId).get();
    snapshot.docs.forEach((doc) => addDocToMap(docs, doc));
  }

  return Array.from(docs.values());
}

async function deleteMember(memberId) {
  const { getFirestore } = require('../../config/firebase');
  const db = getFirestore();
  const { findFirebaseMemberRef } = require('./member.firebase.helper');
  const memberRef = await findFirebaseMemberRef(db, memberId);

  if (!memberRef) {
    throw createError('Member not found', 404);
  }

  const memberDoc = await memberRef.get();
  const memberData = memberDoc.data() || {};
  const memberIds = Array.from(
    new Set(
      [memberId, memberRef.id, memberData.id, String(memberData.id || '')]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  );
  const [lineupDocs, attendanceDocs, legacyAttendanceDocs] = await Promise.all([
    queryDocsByMemberIds(db.collection('lineupSlots'), 'member_id', memberIds),
    queryDocsByMemberIds(db.collection('eventAttendances'), 'member_id', memberIds),
    queryDocsByMemberIds(db.collection('event_attendances'), 'member_id', memberIds),
  ]);
  const attendanceDocMap = new Map();
  const timestamp = nowIso();

  [...attendanceDocs, ...legacyAttendanceDocs].forEach((doc) => addDocToMap(attendanceDocMap, doc));

  for (const recordsChunk of chunk(lineupDocs, 400)) {
    const batch = db.batch();

    recordsChunk.forEach((doc) => {
      batch.set(
        doc.ref,
        {
          member_id: null,
          updated_at: timestamp,
        },
        { merge: true },
      );
    });

    await batch.commit();
  }

  for (const recordsChunk of chunk(Array.from(attendanceDocMap.values()), 400)) {
    const batch = db.batch();

    recordsChunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  await memberRef.delete();

  return getMembers();
}

module.exports = {
  createMember,
  deleteMember,
  getMembers,
  memberPositions,
  memberStatuses,
  adjustMemberActivityScore,
  updateMember,
  updateMemberStatus,
};
