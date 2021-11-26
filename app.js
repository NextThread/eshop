const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const adminRoutes = require("./routes/adminRoutes");
const shopRoutes = require("./routes/shopRoutes");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/errorController");

const MONGODB_URL =
  "mongodb+srv://ryanmwakio:ngs%40ngo1620@cluster0.temth.mongodb.net/eshop?retryWrites=true&w=majority";

const app = express();
const store = new MongoDbStore({
  uri: MONGODB_URL,
  collection: "sessions",
});
const csrfProtection = csrf();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: true,
    saveUninitialized: true,
    store: store,
  })
);

app.use(csrfProtection);

app.use((req, res, next) => {
  req.user = req.session.user;

  next();
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  res.locals.role = req.user ? req.user.role : 2;
  next();
});

app.use(flash());

app.use(authRoutes);
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use("/500", errorController.error500);

app.all("*", (req, res, next) => {
  let isLoggedIn = req.get("Cookie") ? req.get("Cookie").split("=")[1] : false;
  isLoggedIn = Boolean(isLoggedIn);

  res.render("404", {
    title: "sorry page not found",
    path: null,
    isAuthenticated: isLoggedIn,
  });
});

app.use((error, req, res, next) => {
  res.redirect("/500");
});

const devUrl = "mongodb://127.0.0.1:27017/eshop";

mongoose
  .connect(MONGODB_URL)
  .then((result) => {
    console.log("connected");

    app.listen(8080, () => {
      console.log("server running at http://127.0.0.1:8080");
    });
  })
  .catch((err) => {
    console.error(err);
    res.redirect("/500");
  });
