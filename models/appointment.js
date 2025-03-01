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
    status: {
        type: String,
        enum: ["pending", "confirmed", "completed", "cancelled"],
        default: "pending"
    },
    reason: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    disease: {
        type: String // Disease diagnosed during appointment
    },
    summary: {
        type: String // Doctor's summary after appointment
    },
    attachments: {
        type: [String], // Array of file paths (PDFs, images, etc.)
        default: []
    }
}, { timestamps: true }); // Enables `createdAt` and `updatedAt` fields

module.exports = mongoose.model("Appointment", appointmentSchema);
