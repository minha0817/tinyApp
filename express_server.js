const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//---------------------------generateRandomStr
const generateRandomStr = function () {
  const randomStr = Math.random().toString(36).substring(2, 8);
  return randomStr;
};

//----------------------------database
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  minha: {
    id: "minha",
    email: "minha@mail.com",
    password: "1234",
  },
  chris: {
    id: "chris",
    email: "chris@mail.com",
    password: "12345",
  },
};

const findUserByEmail = (email) => {
  for (const userId in users) {
    const userFromDb = users[userId];

    if (userFromDb.email === email) {
      return userFromDb;
    }
  }
  return null;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const id = req.cookies.userId;
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies.userId;
  const user = users[id];
  const templateVars = {
    user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.cookies.userId;
  const user = users[id];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomStr();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//---------------------------- POST /login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = findUserByEmail(email);

  if (!user) {
    return res
      .status(403)
      .send("no user with that email found. Please register first");
  }

  if (user.password !== password) {
    return res.status(403).send("Wrong password");
  }

  res.cookie("userId", user.id);

  res.redirect("/urls");
});

//----------------------- GET /login
app.get("/login", (req, res) => {
  const id = req.cookies.userId;
  const user = users[id];
  const templateVars = {
    user,
  };

  if (user) {
    return res.redirect("/urls");
  }

  return res.render("login", templateVars);
});

//-------------------- POST /logout
app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/urls");
});

//----------------------- POST /register
app.post("/register", (req, res) => {
  const id = generateRandomStr();
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    return res.status(400).send("Please enter Email AND Password");
  }

  const userFromDb = findUserByEmail(email);

  if (userFromDb) {
    return res.status(400).send("The Email is already in use");
  }

  const user = {
    id,
    email,
    password,
  };

  users[id] = user;

  res.cookie("userId", id);
  res.redirect("/urls");
});

//------------------------------ GET /register
app.get("/register", (req, res) => {
  const id = req.cookies.userId;
  const user = users[id];
  const templateVars = {
    user,
  };

  if (user) {
    return res.redirect("/urls");
  }

  return res.render("register", templateVars);
});

//{ user: null }

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
