const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const healthRecordSchema = new Schema({
    doc: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: true,
    },
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
        default: Date.now,
    },
});

module.exports = mongoose.model("HealthRecord", healthRecordSchema);
