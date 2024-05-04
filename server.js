const path = require("path")
const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
const app = express();

app.use(express.static('Public'));

const PORT = process.env.PORT || 4000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.urlencoded({ extended: false }));
// Set the views directory to the root folder
app.set('views', path.join(__dirname, './'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

app.use(cors());
app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());



app.get("/", (req, res) => {
  res.render("index");
});

app.get("/users/signup", checkAuthenticated, (req, res) => {
  res.render("signup");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  //console.log(req.session.flash.error);
  res.render("login");
});

app.get("/users/homepage", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("homepage", { user: req.user.name });
});

app.get("/users/Aboutus", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("Aboutus");
});

app.get("/users/Contactus", (req, res) => {
  res.render("Contactus");
});

app.get("/users/Subjects", (req, res) => {
  res.render("Subjects");
});

app.get("/users/Academics", (req, res) => {
  res.render("Academics");
});

app.get("/users/logout", (req, res) => {
  req.logout(function(err) {
    if (err) {
      return res.status(500).json({ message: "Error during logout." });
    }
    //res.status(200).json({ message: "Logout successful." });
    res.redirect("/users/login");
  });
});

app.post("/users/signup", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("signup", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          errors.push({message: "Email already registered"})
          return res.render("signup", { errors })  
        } else {
          pool.query(
            `INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, password`,
            [name, email, hashedPassword],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/homepage",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/homepage");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
