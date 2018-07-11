require('dotenv').config();


var express = require("express");
          app = express();
          bodyParser = require("body-parser");
          mongoose = require("mongoose");


          passport = require("passport");
          localStrategy = require("passport-local");

          Campground = require("./models/campground");
          Comment = require("./models/comment");
          User = require("./models/user");

          methodOverride = require("method-override");

          flash = require("connect-flash");




var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");
var userRoutes = require("./routes/users");

// Method override needs to be high for others to see.
app.use(methodOverride("_method"));

// Flash needs to be before passport configuration.
app.use(flash());

// Disable cache.
app.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, ' +
        'max-stale=0, post-check=0, pre-check=0');
    next();
});


// Clear database & and populate. Commented out to save new objects permanently.

// seedDB();


// mongoose.connect("mongodb://localhost:/campgroundsDB");
mongoose.connect("mongodb://fred:collins2@ds153460.mlab.com:53460/campgrounds");


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.locals.moment = require('moment');


// PASSPORT CONFIGURATION.
app.use(require("express-session")({
    secret: "This is the express-session secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Pass current user to all templates.

// Also pass 2 last URL to go back one page after successful login if there is no next activity.
// For this to work also add     delete req.session.returnTo;   in comments.post & campgrounds.post routes
// Otherwise it will prioritize these previous posts because of line
// res.redirect(req.session.returnTo || beforePreviousURL);
// in index.js

app.use(function(req, res, next) {
    if (typeof previousURL !== 'undefined') {
        beforePreviousURL = previousURL;
    }
    if (typeof thisURL !== 'undefined') {
        previousURL = thisURL;
    }
    thisURL = req.originalUrl;

    res.locals.currentUser = req.user;

    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");

    next();
});

// Use routes.

app.use(indexRoutes);
// Make all campground routes start with "/campgrounds/"
app.use("/campgrounds", campgroundRoutes);
// Same for comments, index doesn't have common address.
app.use("/campgrounds/:id/comments", commentRoutes);
app.use(userRoutes);



var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('Camp Server has started');
});