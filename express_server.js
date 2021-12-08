const PORT = 8080;

const express = require("express");
const app = express();
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else res.redirect("/register");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    user_id: req.cookies["user_id"],
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  if (id.length === 0 || email.length === 0) {
    //This checks if the input is empty
    res.statusCode = 400;
    res.render("urls_404.ejs");
  } else if (emailFinder(users, email)) {
    //This checks if there is duplicate email
    res.statusCode = 400;
    res.render("urls_404.ejs");
  } else {
    //if everything is okay this here will create an object
    users[id] = {
      id: id,
      email: email,
      password: password,
    };

    res.cookie("user_id", users[id].id);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    user_id: req.cookies["user_id"],
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  let myUser = passwordFinder(users, email, password);

  if (myUser) {
    res.cookie("user_id", myUser["id"]);
    res.redirect("/urls");
  } else {
    res.statusCode = 403;
    res.render("urls_404");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
    user_id: req.cookies["user_id"],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      user_id: req.cookies["user_id"],
    };
    res.render("urls_new", templateVars);
  } else res.redirect("/login");
});

app.post("/urls/new", (req, res) => {
  if (req.body.longURL.length === 0) {
    res.render("urls_404.ejs"); //404 Undefined
  } else {
    //edit database
    urlDatabase[generateRandomString()] = {
      longURL: req.body.longURL,
      userID: users[req.cookies["user_id"]],
    };
    //edit database
    const templateVars = {
      user: users[req.cookies["user_id"]],
      user_id: req.cookies["user_id"],
      urls: urlDatabase,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.render("urls_404.ejs"); //404 Undefined
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]],
      user_id: req.cookies["user_id"],
      shortURL: req.params.shortURL,
      //edit database
      longURL: urlDatabase[req.params.shortURL]["longURL"],
      //edit database
    };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  //this is POST "/urls/:shortURL"
  delete urlDatabase[req.params.id];
  //edit database
  urlDatabase[req.params.id] = {
    longURL: req.body.newLongURL,
    userID: users[req.cookies["user_id"]],
  };
  //edit database
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(`/urls/${[req.params.shortURL]}`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

function generateRandomString() {
  let chx = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrtsuvwxyz01234567890";
  let str = "";
  for (let i = 0; i < 6; i++) {
    str += chx.charAt(Math.floor(Math.random() * chx.length));
  }
  return str;
}

function emailFinder(users, newUserEmail) {
  for (let user in users) {
    if (users[user]["email"] === newUserEmail) {
      return true;
    }
  }
  return false;
}

function passwordFinder(users, email, password) {
  for (let user in users) {
    if (users[user]["email"] === email) {
      if (users[user]["password"] === password) {
        return users[user];
      }
    }
  }
}
