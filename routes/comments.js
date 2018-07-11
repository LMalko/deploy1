var express = require("express");
//  Use {mergeParams} to receive id after writing
//  app.use("/campgrounds/:id/comments", commentRoutes);
//  line in app.js
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
// If we don't write the name of the file,
// it will automatically search for index.js.
var middleware = require("../middleware");

// When a user asks to post a comment, middleware isLoggedIn will check first.
// Comments new.
router.get("/new",
    middleware.isLoggedIn,
    function(req, res){
        Campground.findById(req.params.id, function(err, campground){
            if (err){
                console.log(err);
            } else {
                res.render("comments/new", {campground: campground})
            }
        });
    });

//Comments create.
router.post("/",
    middleware.isLoggedIn,
    function(req, res){
        Campground.findById(req.params.id, function(err, campground){
            if(err){
                console.log(err);
                res.redirect("/campgrounds")
            } else {
                delete req.session.returnTo;
                // Use dictionary comment[] from input name in new.ejs.
                Comment.create(req.body.comment, function(err, comment){
                    if(err){
                        console.log(err);
                    } else {
                        //Add id & username to comment
                        comment.author.id = req.user._id;
                        comment.author.username = req.user.username;
                        comment.campground.id = campground._id;
                        comment.campground.campgroundName = campground.name;
                        // Save comment.
                        comment.save();

                        campground.comments.push(comment);
                        campground.save();
                        req.flash("success", "Comment was added");
                        res.redirect("/campgrounds/" + req.params.id);
                    }
                });
            }
        });
    });

// Edit route.
router.get("/:comment_id/edit",
    middleware.checkCommentOwnership,
    function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds")
        } else {
            Comment.findById(req.params.comment_id, function (err, foundComment) {
                if (err) {
                    res.redirect("back");
                } else {
                    res.render("comments/edit",
                        {campground_id: req.params.id, comment: foundComment, campground: campground});
                }
            });
        }
    });
});

// Update route.

router.put("/:comment_id",
    middleware.checkCommentOwnership,
    function(req, res){
    // comment is an entire comment[text] object because it has only one attribute here - text
    Comment.findByIdAndUpdate(req.params.comment_id,
        req.body.comment,
        function(err, updatedComment){
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment edited");

            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

// Destroy comment route.
router.delete("/:comment_id",
    middleware.checkCommentOwnership,
    function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("error", "Comment deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});

module.exports = router;