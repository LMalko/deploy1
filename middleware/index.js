
var middlewareObject = {

};

middlewareObject.checkCampgroundOwnership = function(req, res, next){
        // Check if user is logged in.
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, foundCampground){
                if(err){
                    res.redirect("back");
                } else{
                    // Does user own campground.
                    if(foundCampground.author.id.equals(req.user._id)
                                            || req.user.isAdmin){
                        next();
                    } else{
                        res.redirect("back");
                    }
                }
            });
            //  If not - redirect.
        } else {
            res.redirect("back");
        }
    };

middlewareObject.checkCommentOwnership = function(req, res, next){
        // Check if user is logged in.
        if(req.isAuthenticated()){

            Comment.findById(req.params.comment_id, function(err, foundComment){
                if(err){
                    res.redirect("back");
                } else{
                    // Does user own comment.
                    if(foundComment.author.id.equals(req.user._id)
                                            || req.user.isAdmin){
                        next();
                    } else{
                        res.redirect("back");
                    }
                }
            });
            //  If not - redirect.
        } else {
            res.redirect("back");
        }
    };

middlewareObject.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    // Flashes show on the next page. This line only saves it to memory,
    // it has to be printed to be visible in header.
    req.flash("error", "Please login first!");
    req.session.returnTo = req.originalUrl; //Store users current session
    res.redirect("/login");
};


module.exports = middlewareObject;