const express = require("express");
const router = express.Router();

const { isAuthenticated, isAuthorized } = require("../middleware");

const Appointment = require("../models/appointment");
const Billing = require("../models/billing");
const Patient = require("../models/patient");

const patientController = require("../controllers/patient");

// GET routes
router.get("/dashboard", isAuthenticated, patientController.dashboard);
router.get("/upcomingappointments", isAuthenticated, patientController.upcomingAppointments);
router.get("/todaysappointments", isAuthenticated, patientController.todaysAppointments);
router.get("/pastappointments", isAuthenticated, patientController.pastAppointments);
router.get("/filterappointments", isAuthenticated, patientController.filterAppointments);
router.get("/bookappointment", isAuthenticated, patientController.bookAppointmentPage);
router.get("/healthrecords", isAuthenticated, patientController.healthRecords);
router.get("/prescriptions", isAuthenticated, patientController.prescriptions);
router.get("/doctors", isAuthenticated, patientController.doctors);
router.get("/billings", isAuthenticated, patientController.billings);

// Grouped DELETE routes for canceling appointments
["upcomingappointments", "todaysappointments", "pastappointments"].forEach(type => {
  router
    .route(`/${type}/cancel/:id`)
    .delete(
      isAuthenticated,
      isAuthorized(Appointment, "id", "patientId"),
      patientController.cancelAppointment
    );
});

// POST routes for deleting files
router
  .route("/prescriptions/delete/:id")
  .post(
    isAuthenticated,
    isAuthorized(Appointment, "id", "patientId"),
    patientController.deletePrescription
  );

router
  .route("/billings/delete/:id")
  .post(
    isAuthenticated,
    isAuthorized(Billing, "id", "patientId"),
    patientController.deleteBilling
  );

// POST route for booking appointment
router
  .route("/bookappointment")
  .post(isAuthenticated, patientController.bookAppointment);

router.get("/chat", (req, res) => {
  res.render("patient/chat");
});  

router
.route("/profile/:id")
.get(async (req, res) => {
  const patientId = req.params.id;
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found"
    });
  }
  res.render("patient/profile", { patient });
})
.post(async (req, res) => {
  try {
    const { fullName, gender, age, height, weight, bloodType, phone, address } = req.body.patient;
    const patientId = req.user._id;

    // Build update object only with non-empty fields
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (gender) updates.gender = gender;
    if (age) updates.age = age;
    if (height) updates.height = height;
    if (weight) updates.weight = weight;
    if (bloodType) updates.bloodType = bloodType;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    const updatedPatient = await Patient.findByIdAndUpdate(
      patientId,
      updates,
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    req.flash("success", "Profile updated successfully.");
    res.redirect("/patient/dashboard");
  } catch (err) {
    console.error("Error updating patient data:", err);
    req.flash("danger", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

module.exports = router;
