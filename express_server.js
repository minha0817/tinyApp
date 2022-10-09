const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const getUserByEmail = require("./helpers");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["secret"],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

const generateRandomStr = function () {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return randomStr;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  minha: {
    longURL: "https://lighthouselabs.ca",
    userID: "minha",
  },
};

const users = {
  minha: {
    id: "minha",
    email: "minha@mail.com",
    password: "$2a$10$muBVIbxl3vTPVD.Gi4SudeNdps7W3JIkldddvH52lOlo8zr1M1Tze",
  },
  chris: {
    id: "chris",
    email: "chris@mail.com",
    password: "$2a$10$muBVIbxl3vTPVD.Gi4SudeNdps7W3JIkldddvH52lOlo8zr1M1Tze",
  },
};

const urlsForUser = function (userID, database) {
  const filteredDatabase = {};
  for (let key in database) {
    if (database[key].userID === userID) {
      filteredDatabase[key] = database[key];
    }
  }
  return filteredDatabase;
};

app.get("/", (req, res) => {
  const currentUserID = req.session.userId;
  const user = users[currentUserID];

  if (!user) {
    return res.redirect("/login");
  }

  return res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const currentUserID = req.session.userId;
  const user = users[currentUserID];

  if (!user) {
    return res.status(400).send("Please, log in first");
  }

  const templateVars = {
    urls: urlsForUser(currentUserID, urlDatabase),
    user,
  };

  return res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomStr();
  const id = req.session.userId;
  const user = users[id];

  if (!user) {
    return res.status(400).send("Please, log in first");
  }

  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: id,
  };

  res.redirect(`/urls/${randomString}`);
});

app.get("/urls/new", (req, res) => {
  const id = req.session.userId;
  const user = users[id];
  const templateVars = {
    user,
  };

  if (!user) {
    return res.redirect("/login");
  }

  return res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.session.userId;
  const user = users[id];

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("The shortened url doesn't exist");
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
  };

  if (!user) {
    return res.status(400).send("Please, log in first");
  }

  return res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if (!longURL) {
    return res.status(400).send("The shortened url doesn't exist");
  }

  return res.redirect(longURL);
});

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.session.userId;
  const longURL = urlDatabase[req.params.id].longURL;

  if (!longURL) {
    return res.status(400).send("The shortened url doesn't exist");
  }

  if (!urlDatabase[req.params.id].userID) {
    return res.status(400).send("Please, log in first");
  }

  if (urlDatabase[req.params.id].userID !== id) {
    return res.status(400).send("Sorry! You don't own the URL");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res
      .status(403)
      .send("no user with that email found. Please register first");
  }

  const result = bcrypt.compareSync(password, user.password);

  if (!result) {
    return res.status(403).send("Wrong password");
  }

  req.session.userId = user.id;

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const id = req.session.userId;
  const user = users[id];
  const templateVars = {
    user,
  };

  if (user) {
    return res.redirect("/urls");
  }

  return res.render("login", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const id = generateRandomStr();
  const email = req.body.email;
  const password = req.body.password;

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  if (email === "" || password === "") {
    return res.status(400).send("Please enter Email AND Password");
  }

  const userFromDb = getUserByEmail(email, users);

  if (userFromDb) {
    return res.status(400).send("The Email is already in use");
  }

  const user = {
    id,
    email,
    password: hash,
  };

  users[id] = user;

  req.session.userId = id;

  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const id = req.session.userId;
  const user = users[id];
  const templateVars = {
    user,
  };

  if (user) {
    return res.redirect("/urls");
  }

  return res.render("register", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
