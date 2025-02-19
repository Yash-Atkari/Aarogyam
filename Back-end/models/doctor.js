const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const doctorSchema = new Schema ({
    email: {
        type: String,
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    availabilitySlots: [
        {
            day: String,   // e.g., "Monday"
            time: String   // e.g., "10:00 AM - 1:00 PM"
        }
    ],
    hospital: {
        type: String,
        required: true
    },
    consultantFees: {
        type: Number,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    profile: {
        type: String,
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
});

module.exports = mongoose.model("Doctor", doctorSchema);
