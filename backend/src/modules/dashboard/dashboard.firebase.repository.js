const { getFirestore } = require('../../config/firebase');

const positionRank = {
  'Guild Master': 1,
  'Vice Guild Master': 2,
  Commander: 3,
  'Charisma Baby': 4,
  Officer: 5,
  Kumo: 6,
  Noroi: 7,
  Member: 8,
  NEW: 9,
};

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

function normalizeDoc(doc) {
  return {
    id: doc.id,
    ...doc.data(),
  };
}

async function readCollectionNames(names) {
  const db = getFirestore();
  const snapshots = await Promise.all(
    names.map((name) => db.collection(name).get()),
  );
  const records = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      records.set(doc.id, normalizeDoc(doc));
    });
  });

  return Array.from(records.values());
}

function getMemberId(member) {
  return String(member.id || member.member_id || member.uid || '');
}

function getAttendanceMemberId(attendance) {
  return String(
    attendance.member_id ||
      attendance.memberId ||
      attendance.member ||
      attendance.memberUid ||
      '',
  );
}

function createJobLookup(jobs) {
  const lookup = new Map();

  jobs.forEach((job) => {
    if (job.id) {
      lookup.set(String(job.id), job);
    }

    if (job.slug) {
      lookup.set(String(job.slug), job);
    }

    if (job.job_slug) {
      lookup.set(String(job.job_slug), job);
    }
  });

  return lookup;
}

function resolveJob(member, jobLookup) {
  const ref =
    member.job_id ||
    member.jobId ||
    member.job_slug ||
    member.jobSlug ||
    member.job;

  return jobLookup.get(String(ref)) || {};
}

function getFallbackActivityScore(member) {
  const score =
    member.activity_score ??
    member.activityScore ??
    member.attendance_total ??
    member.attendanceTotal ??
    member.total_active ??
    member.totalActive ??
    0;

  return Number(score) || 0;
}

function normalizePosition(position) {
  return positionAliases[String(position || 'Member').trim().toLowerCase()] || 'Member';
}

async function getMemberActivityScores() {
  const [members, jobs, attendances] = await Promise.all([
    readCollectionNames(['members']),
    readCollectionNames(['jobs']),
    readCollectionNames(['eventAttendances', 'event_attendances']),
  ]);

  const jobLookup = createJobLookup(jobs);
  const attendanceCount = new Map();

  attendances.forEach((attendance) => {
    const memberId = getAttendanceMemberId(attendance);

    if (!memberId) {
      return;
    }

    attendanceCount.set(memberId, (attendanceCount.get(memberId) || 0) + 1);
  });

  return members
    .map((member) => {
      const job = resolveJob(member, jobLookup);
      const memberId = getMemberId(member);

      return {
        id: member.id,
        nickname: member.nickname || member.name || '-',
        position: normalizePosition(member.position),
        status: member.status || 'active',
        job_name: member.job_name || member.jobName || job.name || '-',
        job_slug: member.job_slug || member.jobSlug || job.slug || 'default',
        job_icon: member.job_icon || member.jobIcon || job.icon || job.slug,
        activity_score: getFallbackActivityScore(member),
        attendance_count: attendanceCount.get(memberId) || 0,
      };
    })
    .sort((first, second) => {
      const scoreDifference =
        Number(second.activity_score || 0) - Number(first.activity_score || 0);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const firstRank = positionRank[first.position] || 99;
      const secondRank = positionRank[second.position] || 99;

      if (firstRank !== secondRank) {
        return firstRank - secondRank;
      }

      return String(first.id).localeCompare(String(second.id));
    });
}

async function getDashboardData() {
  const [members, events, attendances] = await Promise.all([
    getMemberActivityScores(),
    readCollectionNames(['events']),
    readCollectionNames(['eventAttendances', 'event_attendances']),
  ]);

  return {
    summary: {
      totalMembers: members.length,
      totalEvents: events.length,
      totalAttendances: attendances.length,
    },
    members,
  };
}

module.exports = {
  getDashboardData,
  getMemberActivityScores,
};
