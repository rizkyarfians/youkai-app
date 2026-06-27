const fs = require('fs');
const path = require('path');

require('../src/config/loadEnv')();

const { getFirestore } = require('../src/config/firebase');
const { defaultJobs } = require('../src/data/defaultData');

function readImportFile() {
  const filePath = path.resolve(
    process.cwd(),
    process.argv[2] || 'data/youkai-members.json',
  );
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!Array.isArray(payload.members)) {
    throw new Error(`Import file does not contain a members array: ${filePath}`);
  }

  return {
    filePath,
    members: payload.members,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function chunk(records, size) {
  const chunks = [];

  for (let index = 0; index < records.length; index += size) {
    chunks.push(records.slice(index, index + size));
  }

  return chunks;
}

function memberDocId(member) {
  return `member-${String(member.id).padStart(3, '0')}`;
}

async function replaceMembers(db, members) {
  const timestamp = nowIso();
  const nextDocIds = new Set(members.map(memberDocId));
  const existingSnapshot = await db.collection('members').get();
  const staleDocs = existingSnapshot.docs.filter((doc) => !nextDocIds.has(doc.id));

  for (const recordsChunk of chunk(staleDocs, 400)) {
    const batch = db.batch();

    recordsChunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  for (const recordsChunk of chunk(members, 400)) {
    const batch = db.batch();

    recordsChunk.forEach((member) => {
      const ref = db.collection('members').doc(memberDocId(member));

      batch.set(
        ref,
        {
          ...member,
          updated_at: timestamp,
          imported_at: timestamp,
        },
        { merge: true },
      );
    });

    await batch.commit();
  }
}

async function ensureJobs(db) {
  const timestamp = nowIso();
  const batch = db.batch();

  defaultJobs.forEach((job) => {
    batch.set(
      db.collection('jobs').doc(job.slug),
      {
        ...job,
        updated_at: timestamp,
      },
      { merge: true },
    );
  });

  await batch.commit();
}

async function clearLineupAssignments(db) {
  const snapshot = await db.collection('lineupSlots').get();

  for (const docsChunk of chunk(snapshot.docs, 400)) {
    const batch = db.batch();

    docsChunk.forEach((doc) => {
      batch.set(
        doc.ref,
        {
          member_id: null,
          updated_at: nowIso(),
        },
        { merge: true },
      );
    });

    await batch.commit();
  }
}

async function main() {
  const { filePath, members } = readImportFile();
  const db = getFirestore();

  await ensureJobs(db);
  await replaceMembers(db, members);

  if (process.env.RESET_LINEUPS === 'true') {
    await clearLineupAssignments(db);
  }

  console.log(`Imported ${members.length} members from ${filePath} to Firestore.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
