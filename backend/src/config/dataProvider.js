function getDataProvider() {
  return 'firebase';
}

function isFirebaseProvider() {
  return true;
}

module.exports = {
  getDataProvider,
  isFirebaseProvider,
};
