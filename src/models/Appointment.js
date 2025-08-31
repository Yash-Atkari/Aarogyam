const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
    patientId: {
        type: Schema.Types.ObjectId,
        ref: "Patient",
        required: true
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending"
    },
    reason: {
        type: String
    },
    disease: {
        type: String
    },
    symptoms: {
        type: String
    },
    attachments: {
        type: [String],
        default: []
    },
    healthrecord: {
        type: Schema.Types.ObjectId,
        ref: "HealthRecord"
    },
    billing: {
        type: Schema.Types.ObjectId,
        ref: "Billing"
    },
}, { timestamps: true }); 

module.exports = mongoose.model("Appointment", appointmentSchema);
