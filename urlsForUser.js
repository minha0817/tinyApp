const urlsForUser = function (userID, database) {
  const filteredDatabase = {};
  for (let key in database) {
    if (database[key].userID === userID) {
      filteredDatabase[key] = database[key];
    }
  }
  return filteredDatabase;
};

module.exports = urlsForUser;
