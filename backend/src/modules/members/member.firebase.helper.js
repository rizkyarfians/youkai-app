async function findFirebaseMemberRef(db, memberId) {
  const membersRef = db.collection('members');
  const directRef = membersRef.doc(String(memberId));
  const directDoc = await directRef.get();

  if (directDoc.exists) {
    return directRef;
  }

  const numericId = Number(memberId);

  if (Number.isInteger(numericId)) {
    const numericSnapshot = await membersRef.where('id', '==', numericId).limit(1).get();

    if (!numericSnapshot.empty) {
      return numericSnapshot.docs[0].ref;
    }
  }

  const stringSnapshot = await membersRef.where('id', '==', String(memberId)).limit(1).get();

  if (!stringSnapshot.empty) {
    return stringSnapshot.docs[0].ref;
  }

  return null;
}

module.exports = {
  findFirebaseMemberRef,
};
