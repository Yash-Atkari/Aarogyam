const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["patient", "doctor", "admin"],
        default: "doctor"
    },
    specialization: {
        type: String, // Doctor-specific
        required: function() { return this.role === "doctor"; }
    },
    experience: {
        type: Number, // Doctor-specific
        required: function() { return this.role === "doctor"; }
    },
    availabilitySlots: {
        type: [String], // Doctor-specific
        required: function() { return this.role === "doctor"; }
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
