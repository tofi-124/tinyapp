const bcrypt = require("bcryptjs");

//Checks duplicate email
function getUserByEmail(newUserEmail, users) {
  for (let user in users) {
    if (users[user]["email"] === newUserEmail) {
      return user;
    }
  }
  return undefined;
}

//authentication
function passwordFinder(users, email, password) {
  for (let user in users) {
    if (users[user]["email"] === email) {
      if (bcrypt.compareSync(password, users[user]["password"])) {
        return users[user];
      }
    }
  }
}

//Generates random string
function generateRandomString() {
  let chx = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrtsuvwxyz01234567890";
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += chx.charAt(Math.floor(Math.random() * chx.length));
  }
  return str;
}

module.exports = { getUserByEmail, generateRandomString, passwordFinder };
