const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const doctorController = require("../controllers/doctor");

// Configure multer for uploads
const storage = require("../cloudConfig.js").storage;
const upload = multer({ storage });

// GET routes
router.get("/dashboard", doctorController.dashboard);
router.get("/appointments", doctorController.appointments);
router.get("/patients", doctorController.patients);
router.get("/patient/:id/healthrecords", doctorController.healthRecords);
router.get("/:doctorId/patient/:patientId/prescriptions", doctorController.prescriptions);

// Combined routes using `router.route()`
router
  .route("/appointments/addAppointmentDetails/:id")
  .get(doctorController.renderAddAppointmentDetails)
  .post(
    upload.fields([
      { name: "patient[prescription]", maxCount: 1 },
      { name: "patient[medicalReports]", maxCount: 5 },
      { name: "patient[bill]", maxCount: 1 },
    ]),
    doctorController.addAppointmentDetails
  );

router
  .route("/appointments/edit/:id")
  .get(doctorController.renderEditAppointment)
  .post(
    upload.fields([
      { name: "patient[prescription]", maxCount: 1 },
      { name: "patient[medicalReports]", maxCount: 5 },
      { name: "patient[bill]", maxCount: 1 },
    ]),
    doctorController.editAppointment
  );

// POST-only routes
router.post("/generate-certificate/:patientId", doctorController.generateCertificate);
router.post("/appointments/confirm/:id", doctorController.confirmAppointment);

module.exports = router;
