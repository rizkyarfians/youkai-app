const { isFirebaseProvider } = require('../../config/dataProvider');
const { defaultRoles } = require('../../data/defaultData');

function normalizeRole(role) {
  return {
    id: role.id,
    name: role.name || role.id,
    tone: role.tone || (role.id === 'admin' ? 'Command' : 'Scout'),
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  };
}

async function getFirebaseRoles() {
  const { getFirestore } = require('../../config/firebase');
  const snapshot = await getFirestore().collection('roles').get();

  if (snapshot.empty) {
    return defaultRoles;
  }

  return snapshot.docs.map((doc) => normalizeRole({ id: doc.id, ...doc.data() }));
}

async function getRoles() {
  if (isFirebaseProvider()) {
    return getFirebaseRoles();
  }

  return defaultRoles;
}

module.exports = {
  getRoles,
};
