var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

// AUTHENTICATION ROUTES.
router.get("/register", function(req, res){
    // req.flash("error", "Sign-in was unsuccessful.");
    res.render("register");
});

// HANDLE SIGN-UP LOGIC.
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });

    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            // req.flash("error", "Sign-in was unsuccessful.");

            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", req.body.username + " has successfully signed up");

            //Ensure that after successful sign-in the user will not go back to sign-in page.
            if(beforePreviousURL !== "/campgrounds/*"){
                res.redirect("/campgrounds")
            }
            res.redirect(req.session.returnTo || beforePreviousURL);

            delete req.session.returnTo;
        });
    });
});

// SHOW LOGIN FORM.
router.get("/login", function(req, res){
    if(previousURL === "/login" && beforePreviousURL === "/login"){
        res.render("login", {error: "Invalid username or password"});
    }else{
        res.render("login");
    }
});

// HANDLING LOGIN LOGIC.
//  app.post("/login", middleware, callback)
router.post("/login",
    passport.authenticate("local", {
        // successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
        req.flash("success", req.body.username + " has successfully logged in");

        res.redirect("/campgrounds");

        delete req.session.returnTo;
    });

// LOGOUT ROUTE.
router.get("/logout", function(req, res){
    req.flash("success", "Successful log out");

    req.logout();
    res.redirect("/campgrounds");
});

// SHOW EDIT USER ROUTE.

router.get("/editUser", middleware.isLoggedIn, function(req, res){
    User.find({}, function(err, allUsers){
        if(err){
            console.log(err);
        } else {
            if(req.user.isAdmin){
                res.render("user/edit", {allUsers: allUsers})
            } else {
                res.redirect("campgrounds/");
            }
        }
    });
});

// EDIT USER.

router.put("/editUser", function(req, res){

    User.find({}, function(err, allUsers){
        if(err){
            console.log(err);
        } else {
            allUsers.forEach(function(user){
                if(req.body.userName === user.username){

                    // if(req.body.userRole === "Admin"){
                    //     user.isAdmin = true;
                    // } else{
                    //     user.isAdmin = false;
                    // }
                    user.isAdmin = req.body.userRole === "Admin";

                    User.findByIdAndUpdate(user._id, user,function(err, updatedUser){
                        if(err){
                            req.flash("error", err);
                            res.redirect("/campgrounds");
                        } else {
                            req.flash("success", "User's role assigned");
                            res.redirect("/campgrounds")
                        }
                    });
                }
            });
        }
    });
});

// SHOW DESTROY USER FORM.

router.get("/destroyUser", middleware.isLoggedIn, function(req, res){
    User.find({}, function(err, allUsers){
        if(err){
            console.log(err);
        } else {
            if(req.user.isAdmin){
                res.render("user/destroy", {allUsers: allUsers})
            } else {
                res.redirect("campgrounds/");
            }
        }
    });
});

// DESTROY USER.

router.put("/destroyUser", function(req, res){
    User.find({}, function(err, allUsers){
        if(err){
            console.log(err);
        } else {
            allUsers.forEach(function(user){
                if(req.body.userName === user.username){
                    User.findByIdAndRemove(user._id,function(err){
                        if(err){
                            req.flash("error", err);
                            res.redirect("/campgrounds");
                        } else {
                            req.flash("success", "User was deleted.");
                            res.redirect("/campgrounds")
                        }
                    });
                }
            });
        }
    });
});


// SHOW USER PROFILE.

router.get("/users/:id", function(req, res){

    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Something went wrong with user search.");
            return res.redirect(previousURL)
        }
        Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
            if(err){
                req.flash("error", "Something went wrong with user's campground search.");
                return res.redirect(previousURL)
            }
            Comment.find().where("author.id").equals(foundUser._id).exec(function(err, comments){
                if(err){
                    req.flash("error", "Something went wrong with user'c comments search.");
                    return res.redirect(previousURL)
                }
                res.render("user/show", {user: foundUser, campgrounds: campgrounds, comments: comments})
            });
        });
    });
});
// CHANGE USER AVATAR.
router.get("/users/:id/editAvatar", middleware.isLoggedIn, function(req, res){
    if (req.user._id.equals(req.params.id)){
        res.render("user/editAvatar", {user: req.user})
    } else {
        req.flash("error", "You can't change other user's profile.");
        res.redirect(previousURL)
    }
});

router.put("/users/:id", function(req, res){

    req.user.avatar = req.body.user.avatar;

    User.findByIdAndUpdate(req.user._id, req.user, function(err, updatedUser){
        if(err){
            req.flash("error", err);
            res.redirect("/campgrounds");
        } else {
            req.flash("success", "User's avatar changed");
            res.redirect("/users/" + req.user._id)
        }
    });
});

module.exports = router;