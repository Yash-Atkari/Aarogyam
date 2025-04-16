const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient");
const { isAuthenticated, isAuthorized } = require("../middleware");
const { appointmentSchema } = require('../schema');
const Appointment = require("../models/appointment");
const Billing = require("../models/billing");

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

module.exports = router;
