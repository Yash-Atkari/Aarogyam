const express = require("express");
const router = express.Router();
const multer = require("multer");
const doctorController = require("../controllers/doctor");

const Doctor = require("../models/doctor");

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

router
.route("/profile/:id")
.get(async (req, res) => {
  const doctorId = req.params.id;
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found"
    });
  }
  res.render("doctor/profile", { doctor });
})
.post(async (req, res) => {
  try {
    const { fullName, qualification, specialization, experience, hospital, consultantFees, phone } = req.body.doctor;
    const doctorId = req.user._id;

    // Build update object only with non-empty fields
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (qualification) updates.qualification = qualification;
    if (specialization) updates.specialization = specialization;
    if (experience) updates.experience = experience;
    if (hospital) updates.hospital = hospital;
    if (consultantFees) updates.consultantFees = consultantFees;
    if (phone) updates.phone = phone;

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      updates,
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    req.flash("success", "Profile updated successfully.");
    res.redirect("/doctor/dashboard");
  } catch (err) {
    console.error("Error updating doctor data:", err);
    req.flash("danger", "Internal Server Error.");
    res.redirect("/doctor/dashboard");
  }
});

module.exports = router;
