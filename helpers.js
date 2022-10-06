const getUserByEmail = (email, database) => {
  for (const userId in database) {
    const userFromDb = database[userId];

    if (userFromDb.email === email) {
      return userFromDb;
    }
  }
  return null;
};

module.exports = getUserByEmail;
