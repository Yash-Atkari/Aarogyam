const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const doctorSchema = new Schema ({
    email: {
        type: String,
        required: true,
        unique: true
    },
    specialization: {
        type: String
    },
    experience: {
        type: Number
    },
    availabilitySlots: [
        {
            day: String,
            time: String  
        }
    ],
    hospital: {
        type: String
    },
    consultantFees: {
        type: Number
    },
    phone: {
        type: String
    },
    profile: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        default: 'doctor'
    },
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
