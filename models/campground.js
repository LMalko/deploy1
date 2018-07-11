var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    price: String,
    image: String,
    description: String,

    location: String,
    lat: Number,
    lng: Number,

    createdAt: {type: Date, default: Date.now},

    author: {
        id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],

    imageId: String
});

module.exports = mongoose.model("Campground", campgroundSchema);