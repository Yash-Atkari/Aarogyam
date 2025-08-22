const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const doctorSchema = new Schema ({
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String
    },
    qualification: {
        type: String,
    },
    specialization: {
        type: String
    },
    experience: {
        type: Number
    },
    hospital: {
        type: String
    },
    consultantFees: {
        type: Number
    },
    phone: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        default: 'doctor'
    },
    availabilitySlots: [
        {
            day: { type: String },
            startTime: { type: String },
            endTime: { type: String }
        }
    ],
    appointments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Appointment"
        }
    ],
    patients: [
        {
            type: Schema.Types.ObjectId,
            ref: "Patient"
        }
    ],
}, {
    timestamps: true 
});

doctorSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Doctor", doctorSchema);
