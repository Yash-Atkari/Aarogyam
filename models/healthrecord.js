const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const healthRecordSchema = new Schema({
    recordType: {
        type: String,
        required: true,
        enum: ["Blood Test", "X-ray", "Consultation", "Prescription", "Other"], // Predefined types
    },
    summary: {
        type: String,
        required: true,
    },
    attachments: [
        {
            type: String, // Stores file paths for reports
            required: false,
        },
    ],
    patientId: {
        type: Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now, // Renamed from created_at for clarity
    },
});

module.exports = mongoose.model("HealthRecord", healthRecordSchema);
