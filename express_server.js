//NPMS and CONST vars - start
const PORT = 8080;

const {
  getUserByEmail,
  generateRandomString,
  passwordFinder,
} = require("./helpers");

const bcrypt = require("bcryptjs");

const express = require("express");
const app = express();

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var cookieSession = require("cookie-session");
app.use(
  cookieSession({
    name: "session",
    keys: ["key"],
  })
);

const users = {};
const urlDatabase = {};
//NPMS and CONST vars - end

//All our gets and posts - start
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else res.render("urls_landingpage.ejs");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) res.redirect("/urls");
  else {
    const templateVars = {
      user: users[req.session.user_id],
      user_id: req.session.user_id,
    };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (req.session.user_id) res.redirect("/urls");
  else {
    let id = generateRandomString();
    let email = req.body.email;
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const templateVars = {};

    if (id.length === 0 || email.length === 0) {
      //This checks if the input is empty
      templateVars.error = "Email or Password empty!";
      res.statusCode = 400;
      res.render("urls_404.ejs", templateVars);
    } else if (getUserByEmail(email, users)) {
      //This checks if there is duplicate email
      templateVars.error = "Email already exists!";
      res.statusCode = 400;
      res.render("urls_404.ejs", templateVars);
    } else {
      //if everything is okay this here will create an object
      users[id] = {
        id: id,
        email: email,
        password: hashedPassword,
      };

      req.session.user_id = users[id].id;
      res.redirect("/urls");
    }
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) res.redirect("/urls");
  else {
    const templateVars = {
      user: users[req.session.user_id],
      user_id: req.session.user_id,
    };
    res.render("urls_login", templateVars);
  }
});

app.post("/login", (req, res) => {
  if (req.session.user_id) res.redirect("/urls");
  else {
    const templateVars = {};
    let email = req.body.email;
    let password = req.body.password;
    let myUser = passwordFinder(users, email, password);

    if (myUser) {
      req.session.user_id = myUser["id"];
      res.redirect("/urls");
    } else {
      res.statusCode = 403;
      templateVars.error = "Invalid Email or Password";
      res.render("urls_404", templateVars);
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let userUrl = urlsForUser(req.session.user_id);
    const templateVars = {
      urls: userUrl,
      user: users[req.session.user_id],
      user_id: req.session.user_id,
    };

    res.render("urls_index", templateVars);
  } else {
    const templateVars = {
      error: "Please register or login to create tinyUrls",
    };
    res.render("urls_404.ejs", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id],
      user_id: req.session.user_id,
    };
    res.render("urls_new", templateVars);
  } else {
    const templateVars = {
      error: "Please register or login to create tinyUrls",
    };
    res.render("urls_404.ejs", templateVars);
  }
});

app.post("/urls/new", (req, res) => {
  if (req.body.longURL.length === 0) {
    res.status(400).send("Empty link!");
  } else {
    urlDatabase[generateRandomString()] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    };

    let userUrl = urlsForUser(req.session.user_id);
    const templateVars = {
      user: users[req.session.user_id],
      user_id: req.session.user_id,
      urls: userUrl,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    const templateVars = {};
    templateVars.error = "Invalid: Trying to acess a non existent link";
    res.render("urls_404.ejs", templateVars);
  } else {
    if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
      const templateVars = {
        user: users[req.session.user_id],
        user_id: req.session.user_id,
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL]["longURL"],
      };
      res.render("urls_show", templateVars);
    } else res.render("urls_landingpage.ejs");
  }
});

app.post("/urls/:id", (req, res) => {
  //this is POST "/urls/:shortURL"
  if (req.session.user_id === urlDatabase[req.params.id]["userID"]) {
    delete urlDatabase[req.params.id];

    urlDatabase[req.params.id] = {
      longURL: req.body.newLongURL,
      userID: req.session.user_id,
    };
    res.redirect("/urls");
  } else res.render("urls_landingpage.ejs");
});

app.get("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else res.render("urls_landingpage.ejs");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL]["userID"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else res.render("urls_landingpage.ejs");
});

app.get("/u/:shortURL", (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]["longURL"]);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//All our gets and posts - end

//Helper - start
function urlsForUser(id) {
  let myNewurl = {};
  for (let urls in urlDatabase) {
    if (urlDatabase[urls]["userID"] === id) {
      myNewurl[urls] = {
        longURL: urlDatabase[urls]["longURL"],
        userID: urlDatabase[urls]["userID"],
      };
    }
  }
  return myNewurl;
}
//Helper - end
function urlsForUser(id) {
  let myNewurl = {};
  for (let urls in urlDatabase) {
    if (urlDatabase[urls]["userID"] === id) {
      myNewurl[urls] = {
        longURL: urlDatabase[urls]["longURL"],
        userID: urlDatabase[urls]["userID"],
      };
    }
  }
  return myNewurl;
}