function getBearerToken(req) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

async function getUserRole(uid, decodedToken) {
  if (decodedToken.role) {
    return decodedToken.role;
  }

  if (decodedToken.admin === true) {
    return 'admin';
  }

  const { getFirestore } = require('../config/firebase');
  const userDoc = await getFirestore().collection('users').doc(uid).get();

  if (userDoc.exists && userDoc.data().role) {
    return userDoc.data().role;
  }

  return 'user';
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Missing Firebase ID token',
      });
      return;
    }

    const { getFirebaseAuth } = require('../config/firebase');
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    const role = await getUserRole(decodedToken.uid, decodedToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      role,
      provider: 'firebase',
    };

    next();
  } catch (error) {
    next(error);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication is required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'This role cannot access the requested action',
      });
      return;
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
};
