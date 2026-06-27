function getRepository() {
  return require('./dashboard.firebase.repository');
}

async function getMemberActivityScores() {
  return getRepository().getMemberActivityScores();
}

async function getDashboardData() {
  return getRepository().getDashboardData();
}

module.exports = {
  getDashboardData,
  getMemberActivityScores,
};
