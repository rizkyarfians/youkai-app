const TEAM_COUNT = 8;
const SLOT_COUNT = 5;

function normalizeNumber(value, label, max) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1 || number > max) {
    const error = new Error(`${label} must be between 1 and ${max}`);
    error.statusCode = 400;
    throw error;
  }

  return number;
}

function normalizeMemberId(memberId) {
  if (memberId === null || memberId === undefined || memberId === '') {
    return null;
  }

  return String(memberId);
}

function emptyTeams() {
  return Array.from({ length: TEAM_COUNT }, (_, teamIndex) => ({
    team_number: teamIndex + 1,
    name: `Team ${teamIndex + 1}`,
    slots: Array.from({ length: SLOT_COUNT }, (_, slotIndex) => ({
      team_number: teamIndex + 1,
      slot_number: slotIndex + 1,
      member_id: null,
      member: null,
      note: null,
    })),
  }));
}

function formatLineupResponse(teams, members) {
  const assignedMemberIds = new Set();

  teams.forEach((team) => {
    team.slots.forEach((slot) => {
      if (slot.member_id) {
        assignedMemberIds.add(String(slot.member_id));
      }
    });
  });

  return {
    teams,
    availableMembers: members.filter((member) => !assignedMemberIds.has(String(member.id))),
  };
}

async function getFirebaseLineups() {
  const { getFirestore } = require('../../config/firebase');
  const members = require('../members/member.service');
  const db = getFirestore();
  const [slotsSnapshot, memberRows] = await Promise.all([
    db.collection('lineupSlots').get(),
    members.getMembers(),
  ]);
  const memberLookup = new Map(memberRows.map((member) => [String(member.id), member]));
  const teams = emptyTeams();

  slotsSnapshot.docs.forEach((doc) => {
    const slot = doc.data();
    const team = teams[Number(slot.team_number) - 1];
    const targetSlot = team?.slots[Number(slot.slot_number) - 1];

    if (!targetSlot) {
      return;
    }

    targetSlot.member_id = slot.member_id || null;
    targetSlot.member = slot.member_id ? memberLookup.get(String(slot.member_id)) || null : null;
    targetSlot.note = slot.note || null;
  });

  return formatLineupResponse(teams, memberRows);
}

async function updateFirebaseLineupSlot(teamNumber, slotNumber, memberId) {
  const { getFirestore } = require('../../config/firebase');
  const db = getFirestore();
  const timestamp = new Date().toISOString();
  const batch = db.batch();

  if (memberId) {
    const { findFirebaseMemberRef } = require('../members/member.firebase.helper');
    const memberRef = await findFirebaseMemberRef(db, memberId);

    if (!memberRef) {
      const error = new Error('Member not found');
      error.statusCode = 404;
      throw error;
    }

    const duplicates = await db
      .collection('lineupSlots')
      .where('member_id', '==', String(memberId))
      .get();

    duplicates.docs.forEach((doc) => {
      batch.set(
        doc.ref,
        {
          member_id: null,
          updated_at: timestamp,
        },
        { merge: true },
      );
    });
  }

  const slotRef = db
    .collection('lineupSlots')
    .doc(`team-${teamNumber}-slot-${slotNumber}`);

  batch.set(
    slotRef,
    {
      team_number: teamNumber,
      slot_number: slotNumber,
      member_id: memberId,
      updated_at: timestamp,
    },
    { merge: true },
  );

  await batch.commit();
}

async function getLineups() {
  return getFirebaseLineups();
}

async function updateLineupSlot(teamNumberValue, slotNumberValue, memberIdValue) {
  const teamNumber = normalizeNumber(teamNumberValue, 'teamNumber', TEAM_COUNT);
  const slotNumber = normalizeNumber(slotNumberValue, 'slotNumber', SLOT_COUNT);
  const memberId = normalizeMemberId(memberIdValue);

  await updateFirebaseLineupSlot(teamNumber, slotNumber, memberId);

  return getLineups();
}

module.exports = {
  getLineups,
  updateLineupSlot,
};
