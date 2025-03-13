const express = require("express");
const router = express.Router();

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const Appointment = require("../models/appointment");
const HealthRecord = require("../models/healthrecord"); 
const Billing = require("../models/billing");

const { isAuthenticated } = require("../middleware");

router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const patientId = req.user._id;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      req.flash("error", "Patient not found.");
      return res.redirect("/login"); // Or another suitable route
    }

    res.render("patient/dashboard", { patient });

  } catch (err) {
    console.error("Error fetching patient data:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/auth/login"); // Redirect to login or an error page
  }
});

router.get("/todaysappointments", isAuthenticated, async (req, res) => {
  try {
    const patientId = req.user ? req.user._id : "67b6d14db339e23694c73bf9";

    const appointments = await Appointment.find({ patientId })
      .populate("patientId")
      .populate("doctorId");

    res.render("patient/appointments/todaysappointments", { appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

// Appointment cancel route

router.delete("/todaysappointments/cancel/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect("/patient/todaysappointments");
    }

    await Appointment.findByIdAndDelete(id);

    req.flash("success", "Appointment canceled successfully!");
    res.redirect("/patient/todaysappointments");
  } catch (error) {
    console.error("Error canceling appointment:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/todaysappointments");
  }
});

router.get("/bookappointment", isAuthenticated, async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.render("patient/appointments/bookappointment", { doctors });
  } catch (err) {
    console.error("Error rendering appointment booking page:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

router.get("/healthrecords", isAuthenticated, async (req, res) => {
  try {
    const patientId = req.user._id;
    const records = await HealthRecord.find({ patientId }).populate("doctorId");

    res.render("patient/healthrecords", { records });
  } catch (err) {
    console.error("Error fetching health records:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

router.get("/prescriptions", isAuthenticated, async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointments = await Appointment.find({ patientId }).populate("doctorId");

    res.render("patient/prescriptions", { appointments });
  } catch (err) {
    console.error("Error fetching prescriptions:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

// Prescription delete route

router.post("/prescriptions/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { file } = req.query;

    if (!file) {
      req.flash("error", "Invalid file path.");
      return res.redirect("back");
    }

    // Find the appointment
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect("back");
    }

    // Remove the file from attachments
    appointment.attachments = appointment.attachments.filter((attachment) => attachment !== file);
    await appointment.save();

    req.flash("success", "Prescription deleted successfully.");
    res.redirect("back");
  } catch (error) {
    console.error("Error deleting prescription:", error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

router.get("/billings", isAuthenticated, async (req, res) => {
  try {
    const patientId = req.user._id;

    const bills = await Billing.find({ patientId }).populate("doctorId");

    res.render("patient/billings", { bills });
  } catch (err) {
    console.error("Error fetching billings:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

// Billing delete route

router.post("/billings/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const billingId = req.params.id;
    const filePath = req.query.file; // Get file path from query params

    // Find the billing record
    const billing = await Billing.findById(billingId);
    if (!billing) {
      req.flash("error", "Billing record not found.");
      return res.redirect("back");
    }

    // Remove the file from attachments array
    billing.attachments = billing.attachments.filter(file => file !== filePath);
    
    // Save updated billing record
    await billing.save();

    req.flash("success", "Billing deleted successfully.");
    res.redirect("back");
  } catch (error) {
    console.error("Error deleting billing:", error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

router.get("/doctors", isAuthenticated, async (req, res) => {
  try {
    const patientId = req.user._id; // Get from authenticated user

    const patient = await Patient.findById(patientId).populate("doctors");

    if (!patient) {
      req.flash("error", "Patient not found.");
      return res.redirect("/patient/dashboard");
    }

    res.render("patient/doctors", { doctors: patient.doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

// ------------------------------------
// 🔹 PATIENT POST ROUTES
// ------------------------------------

router.post("/bookappointment", isAuthenticated, async (req, res) => {
  try {
    // Extract the logged-in patient's ID
    const patientId = req.user._id;

    // Ensure all required fields are present
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;
    if (!doctorId || !appointmentDate || !timeSlot || !reason) {
      req.flash("error", "All fields are required.");
      return res.redirect("/patient/bookappointment");
    }

    // Create a new appointment
    const newAppointment = new Appointment({
      patientId,
      doctorId,
      date: new Date(appointmentDate),
      timeSlot,
      status: "pending",
      reason,
      notes: "",
      disease: "",
      summary: "",
      attachments: [],
    });

    // Save the appointment
    const savedAppointment = await newAppointment.save();

    // Add appointment ID to both doctor and patient records
    await Doctor.findByIdAndUpdate(doctorId, { $push: { appointments: savedAppointment._id } });
    await Patient.findByIdAndUpdate(patientId, { $push: { appointments: savedAppointment._id } });

    req.flash("success", "Appointment booked successfully!");
    res.redirect("/patient/bookappointment");
  } catch (error) {
    console.error("Error booking appointment:", error);
    req.flash("error", "Failed to book appointment. Please try again.");
    res.redirect("/patient/bookappointment");
  }
});

module.exports = router;
