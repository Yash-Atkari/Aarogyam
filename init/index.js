const mongoose = require("mongoose");

// Function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;

// Fake health records
const healthRecords = [
  {
    recordType: "Blood Test",
    summary: "Complete blood count (CBC) shows normal hemoglobin and platelets.",
    attachments: ["uploads/cbc-report.pdf"],
    patientId: isValidObjectId("67b6d14db339e23694c73bf9"),
    doctorId: isValidObjectId("67b6d17ab339e23694c73bf8"),
    doctorName: "Dr. Anil Sharma",
    created_at: new Date("2025-02-05T08:00:00Z")
  },
  {
    recordType: "X-ray",
    summary: "Chest X-ray reveals no signs of infection. Lungs are clear.",
    attachments: ["uploads/chest-xray.pdf"],
    patientId: isValidObjectId("67b6d14db339e23694c73bf9"),
    doctorId: isValidObjectId("67b6d17ab339e23694c73b7"),
    doctorName: "Dr. Priya Mehta",
    created_at: new Date("2025-02-12T10:30:00Z")
  },
  {
    recordType: "Consultation",
    summary: "Patient reported dizziness. Recommended hydration and rest.",
    attachments: [],
    patientId: isValidObjectId("67b6d14db339e23694c73bf9"),
    doctorId: isValidObjectId("67b6d17ab339e23694c73bf6"),
    doctorName: "Dr. Ramesh Verma",
    created_at: new Date("2025-02-18T14:00:00Z")
  },
  {
    recordType: "Prescription",
    summary: "Prescribed iron supplements for mild anemia.",
    attachments: ["uploads/prescription-anemia.pdf"],
    patientId: isValidObjectId("67b6d14db339e23694c73bf9"),
    doctorId: isValidObjectId("67b6d17ab339e23694c73b9"),
    doctorName: "Dr. Shalini Gupta",
    created_at: new Date("2025-02-22T09:15:00Z")
  },
  {
    recordType: "Blood Test",
    summary: "Blood sugar levels within normal range. No diabetes detected.",
    attachments: ["uploads/blood-sugar-test.pdf"],
    patientId: isValidObjectId("67b6d14db339e23694c73bf9"),
    doctorId: isValidObjectId("67b6d17ab339e23694c73b5"),
    doctorName: "Dr. Vikram Rao",
    created_at: new Date("2025-02-28T11:45:00Z")
  }
];

// Remove any records where IDs are null
const validHealthRecords = healthRecords.filter(record => record.patientId && record.doctorId);

// Assuming you have a HealthRecord model
const HealthRecord = require("../models/healthrecord"); // Update path if needed

mongoose
  .connect("mongodb://localhost:27017/aarogyam", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB.");

    if (validHealthRecords.length === 0) {
      console.error("No valid health records to insert.");
      mongoose.connection.close();
      return;
    }

    await HealthRecord.insertMany(validHealthRecords);
    console.log("Fake health records inserted successfully.");
    mongoose.connection.close();
  })
  .catch((err) => console.error(err));
