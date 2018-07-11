var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
// If we don't write the name of the file,
// it will automatically search for index.js.
var middleware = require("../middleware");




// Multer & cloudinary configuration code
var multer = require('multer');

var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|bmp)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};






var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'campgrounds2018',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_KEY_SECRET
});

// For google map API
var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);

// Show all campgrounds.

router.get("/", function(req, res){

    // Pagination variables
    var perPage = 4;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;


    if(req.query.search){
        // 'g' modifier: global. All matches (don't return on first match).
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
                        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec({name: regex}, function (err, allCampgrounds) {
                            Campground.count().exec(function (err, count) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    var results;
                                    if (allCampgrounds.length < 1) {
                                        results = "No results."
                                    } else {
                                        results = "Results: " + allCampgrounds.length
                                    }
                                    res.render("campgrounds/index", {
                                        campgrounds: allCampgrounds,
                                        results: results,
                                        current: pageNumber,
                                        pages: Math.ceil(count / perPage)
                                    });
                                }
                            })
                        })
    } else {
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec({}, function (err, allCampgrounds) {
                        Campground.count().exec(function (err, count) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.render("campgrounds/index", {campgrounds: allCampgrounds, results: null,
                                                                                                current: pageNumber,
                                                                                                pages: Math.ceil(count / perPage)
                                });
                            }
                        })
            })
    }
});

// NEW - Show form to create new campground.
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new")
});

// CREATE - Add new campground to DB.
router.post("/", middleware.isLoggedIn, upload.single('image1'), function(req, res){

    var name = req.body.name;
    // Make sure the string 1st letter is Upper & the rest Lower case.
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    var description = req.body.description;
    var price = req.body.price;

    delete req.session.returnTo;

    // Assign current user to this new campground.
    var thisAuthor = {
        id: req.user._id,
        username: req.user.username
    };

    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect("/campgrounds/new");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;

        if(req.file) {

            cloudinary.uploader.upload(req.file.path, function (result) {

                var image = req.body.image;

                // add cloudinary url for the image to the campground object under image property
                req.body.image = result.secure_url;

                req.body.imageId = result.public_id;

                var newCampground = {
                    name: name, image: req.body.image, imageId: req.body.imageId,
                    description: description, author: thisAuthor, price: price,
                    location: location, lat: lat, lng: lng
                };

                Campground.create(newCampground, function (err) {
                    if (err) {
                        req.flash("error", "This name was already taken");
                        res.redirect("/campgrounds/new");
                        console.log(err);
                    } else {
                        req.flash("success", "Campground was added");
                        res.redirect("/campgrounds");
                    }
                });
            });
        } else {

            var newCampground = {
                name: name, image: req.body.image2, imageId: req.body.imageId,
                description: description, author: thisAuthor, price: price,
                location: location, lat: lat, lng: lng
            };

            Campground.create(newCampground, function (err) {
                if (err) {
                    req.flash("error", "This name was already taken");
                    res.redirect("/campgrounds/new");
                    console.log(err);
                } else {
                    req.flash("success", "Campground was added");
                    res.redirect("/campgrounds");
                }
            });
        }
    });
});

// SHOW - shows more info about one campground.
router.get("/:id", function(req, res){
    var campgroundsContainer = [];
    var users = [];

    // Assign all campgrounds to a variable.
    Campground.find(function(err, allCampgrounds) {
        if (err) {
            console.log(err);
        } else {
            campgroundsContainer = allCampgrounds;
        }
    });

    // Assign all users to a variable.
    User.find(function(err, allUsers) {
        if (err) {
            console.log(err);
        } else {
            users = allUsers;
        }
    });

    Campground.findById(req.params.id).populate("comments").exec(
        function(err, foundCampground){
            if(err){
                console.log(err);
            } else{
                res.render("campgrounds/show",
                    {campground: foundCampground,
                        campgrounds: campgroundsContainer,
                        users: users});
            }
        });
});

// Edit campground route, submits the form.
// Pass campground to edit.

router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});
// Update campground route, receives the form.

router.put("/:id", middleware.checkCampgroundOwnership,
    upload.single('image1'), function(req,res) {
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                req.flash('error', err.message);
                return res.redirect('back');
            } else {

                geocoder.geocode(req.body.location, function (err, data) {
                    if (err || !data.length) {
                        req.flash('error', 'Invalid address');
                        return res.redirect('back');
                    }
                    req.body.campground.lat = data[0].latitude;
                    req.body.campground.lng = data[0].longitude;
                    req.body.campground.location = data[0].formattedAddress;

                    // req.file calls for file form input.
                    if (req.file) {

                        cloudinary.v2.uploader.destroy(foundCampground.imageId, function (err, result) {
                            if (err) {
                                console.log(err.message)
                            }
                                cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
                                    if (err) {
                                        req.flash('error', err.message);
                                        return res.redirect("back");
                                    }
                                    req.body.campground.imageId = result.public_id;
                                    req.body.campground.image = result.secure_url;

                                    // Find and update the correct campground and redirect.
                                    // Use mongoose built-in function.

                                    Campground.findByIdAndUpdate(req.params.id,
                                        req.body.campground,
                                        function (err, updatedCampground) {
                                            if (err) {
                                                res.redirect("/campgrounds");
                                            } else {
                                                req.flash("success", "Campground edited");

                                                res.redirect("/campgrounds/" + req.params.id)
                                            }
                                        });
                                });

                        });
                    } else {
                        req.body.campground.image = req.body.image2;
                        Campground.findByIdAndUpdate(req.params.id,
                            req.body.campground,
                            function (err, updatedCampground) {
                                if (err) {
                                    res.redirect("/campgrounds");
                                } else {

                                    req.flash("success", "Campground edited");

                                    res.redirect("/campgrounds/" + req.params.id)
                                }
                            });
                    }
                });
            }
        });
    });


// Destroy campground route.
router.delete("/:id",
    middleware.checkCampgroundOwnership,
    function(req, res){

    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err) {
            req.flash("error", err.message);
        } else {

            cloudinary.v2.uploader.destroy(foundCampground.imageId, function (err, result) {
                if (err) {
                    console.log(err.message)
                }
                    foundCampground.remove();
                    req.flash("error", "Campground deleted");
                    res.redirect("/campgrounds");
            });
        }
    });
});

function escapeRegex(text) {
    // Escape regular expression special characters, get the last match.
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


module.exports = router;