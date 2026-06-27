require('../src/config/loadEnv')();

const { getFirebaseAuth, getFirestore } = require('../src/config/firebase');

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];

    if (!item.startsWith('--')) {
      continue;
    }

    const key = item.slice(2);
    const nextValue = argv[index + 1];

    if (!nextValue || nextValue.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = nextValue;
    index += 1;
  }

  return args;
}

async function resolveUser(args) {
  const auth = getFirebaseAuth();

  if (args.uid) {
    return auth.getUser(args.uid);
  }

  if (args.email) {
    return auth.getUserByEmail(args.email);
  }

  throw new Error('Pass --email user@example.com or --uid firebaseAuthUid');
}

async function setFirebaseUserRole() {
  const args = parseArgs(process.argv.slice(2));
  const role = args.role || 'user';

  if (!['admin', 'user'].includes(role)) {
    throw new Error('Role must be admin or user');
  }

  const user = await resolveUser(args);
  const auth = getFirebaseAuth();
  const firestore = getFirestore();

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    role,
    admin: role === 'admin',
  });

  await firestore.collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      role,
      isActive: true,
      updated_at: new Date().toISOString(),
    },
    { merge: true },
  );

  console.log(`Set ${user.email || user.uid} as ${role}. Ask the user to sign out and sign in again.`);
}

setFirebaseUserRole().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
