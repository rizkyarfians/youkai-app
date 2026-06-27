const fs = require('fs');
const path = require('path');

require('../src/config/loadEnv')();

const { getFirestore } = require('../src/config/firebase');
const {
  defaultEventTypes,
  defaultJobs,
  defaultRoles,
  defaultUsers,
} = require('../src/data/defaultData');

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

async function writeBatch(collectionName, records, getId) {
  const db = getFirestore();
  const timestamp = nowIso();

  for (const recordsChunk of chunk(records, 400)) {
    const batch = db.batch();

    recordsChunk.forEach((record, index) => {
      const docId = String(getId(record, index));
      const ref = db.collection(collectionName).doc(docId);

      batch.set(
        ref,
        {
          ...record,
          created_at: record.created_at || timestamp,
          updated_at: timestamp,
        },
        { merge: true },
      );
    });

    await batch.commit();
  }
}

async function seedFirebase() {
  const importPath = path.resolve(process.cwd(), 'data/youkai-members.json');
  const { members } = JSON.parse(fs.readFileSync(importPath, 'utf8'));

  await writeBatch('roles', defaultRoles, (role) => role.id);
  await writeBatch('users', defaultUsers, (user) => user.id);
  await writeBatch('jobs', defaultJobs, (job) => job.slug);
  await writeBatch('eventTypes', defaultEventTypes, (eventType) => eventType.slug);
  await writeBatch('members', members, (member) => {
    return `member-${String(member.id).padStart(3, '0')}`;
  });

  console.log(`Seeded ${members.length} members, ${defaultJobs.length} jobs, and ${defaultRoles.length} roles to Firebase.`);
}

seedFirebase().catch((error) => {
  console.error(error);
  process.exit(1);
});
