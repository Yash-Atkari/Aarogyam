const express = require("express");
const router = express.Router();

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const Appointment = require("../models/appointment");
const HealthRecord = require("../models/healthrecord"); 
const Billing = require("../models/billing");

const { appointmentSchema } = require('../schema');

const { isAuthenticated, isAuthorized } = require("../middleware");

const ExpressError = require("../utils/ExpressError");

router.get(
  "/dashboard",
  isAuthenticated,
  async (req, res) => {
    try {
      console.log(req.session);
      // Since isAuthorized already ensured ownership,
      // we can safely fetch the patient with id from req.params.
      const patient = await Patient.findById(req.user._id);
      res.render("patient/dashboard", { patient });
    } catch (err) {
      console.error("Error fetching patient data:", err);
      req.flash("danger", "Internal Server Error.");
      res.redirect("/auth/login"); // Redirect to login or an error page
    }
  }
);

router.get(
  "/upcomingappointments", 
  isAuthenticated, 
  async (req, res) => {
  try {
    const patientId = req.user._id;

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0); // Start of next day

    const appointments = await Appointment.find({
      patientId,
      date: { $gte: tomorrow }
    })
    .populate("patientId")
    .populate("doctorId");

    res.render("patient/appointments/upcomingappointments", { appointments });
  } catch (err) {
    console.error("Error fetching upcoming appointments:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

router.get(
  "/todaysappointments", 
  isAuthenticated, 
  async (req, res) => {
  try {
    const patientId = req.user._id;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      patientId,
      date: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate("patientId")
    .populate("doctorId");

    res.render("patient/appointments/todaysappointments", { appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

router.get(
  "/pastappointments", 
  isAuthenticated, 
  async (req, res) => {
  try {
    const patientId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const appointments = await Appointment.find({
      patientId,
      date: { $lt: today }
    })
    .populate("patientId")
    .populate("doctorId");

    res.render("patient/appointments/pastappointments", { appointments });
  } catch (err) {
    console.error("Error fetching past appointments:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/dashboard");
  }
});

// Appointment cancel route

router.delete(
  "/upcomingappointments/cancel/:id", 
  isAuthenticated, 
  isAuthorized(Appointment, "id", "patientId"),
  async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the appointment directly
    await Appointment.findByIdAndDelete(id);

    req.flash("success", "Appointment canceled successfully!");
    res.redirect("/patient/upcomingappointments");
  } catch (error) {
    console.error("Error canceling appointment:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/upcomingappointments");
  }
});

router.delete(
  "/todaysappointments/cancel/:id", 
  isAuthenticated, 
  isAuthorized(Appointment, "id", "patientId"),
  async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the appointment directly
    await Appointment.findByIdAndDelete(id);

    req.flash("success", "Appointment canceled successfully!");
    res.redirect("/patient/todaysappointments");
  } catch (error) {
    console.error("Error canceling appointment:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/todaysappointments");
  }
});

router.delete(
  "/pastappointments/cancel/:id", 
  isAuthenticated, 
  isAuthorized(Appointment, "id", "patientId"),
  async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the appointment directly
    await Appointment.findByIdAndDelete(id);

    req.flash("success", "Appointment canceled successfully!");
    res.redirect("/patient/pastappointments");
  } catch (error) {
    console.error("Error canceling appointment:", error);
    req.flash("error", "Internal Server Error.");
    res.redirect("/patient/pastappointments");
  }
});

router.get(
  "/filterappointments", 
  isAuthenticated, 
  async (req, res) => {
  try {
    const { search, date, status, timeSlot } = req.query;
    let filter = {};

    if (date) filter.date = date;
    if (status) filter.status = status;
    if (timeSlot) filter.timeSlot = timeSlot;

    let appointments = await Appointment.find(filter).populate("doctorId");

    if (search) {
      appointments = appointments.filter((appointment) =>
        appointment.doctorId.username.toLowerCase().includes(search.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(search.toLowerCase()) ||
        appointment.disease.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Determine where the request came from
    const referer = req.get("referer");

    if (referer.includes("/pastappointments")) {
      return res.render("patient/appointments/pastappointments", { appointments });
    } else if (referer.includes("/upcomingappointments")) {
      return res.render("patient/appointments/upcomingappointments", { appointments });
    } else {
      // Default to today's appointments
      return res.render("patient/appointments/todaysappointments", { appointments });
    }

  } catch (error) {
    console.error("Error filtering appointments:", error);
    req.flash("error", "Something went wrong while filtering appointments.");
    res.redirect(req.get("referer"));
  }
});

router.get(
  "/bookappointment", 
  isAuthenticated, 
  async (req, res) => {
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

router.get(
  "/prescriptions", 
  isAuthenticated, 
  async (req, res) => {
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

router.post(
  "/prescriptions/delete/:id", 
  isAuthenticated, 
  isAuthorized(Appointment, "id", "patientId"),
  async (req, res) => {
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

router.get(
  "/billings", 
  isAuthenticated,
  async (req, res) => {
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

router.post(
  "/billings/delete/:id", 
  isAuthenticated, 
  isAuthorized(Billing, "id", "patientId"),
  async (req, res) => {
  try {
    const billingId = req.params.id;
    const filePath = req.query.file; // Get file path from query params

    // Validate file path
    if (!filePath) {
      req.flash("error", "Invalid file path.");
      return res.redirect("back");
    }

    // Find the billing record
    const billing = await Billing.findById(billingId);
    if (!billing) {
      req.flash("error", "Billing record not found.");
      return res.redirect("back");
    }

    // Remove the file from attachments array
    billing.attachments = billing.attachments.filter(file => file !== filePath);
    await billing.save();

    req.flash("success", "Billing deleted successfully.");
    res.redirect("back");
  } catch (error) {
    console.error("Error deleting billing:", error);
    req.flash("error", "Something went wrong.");
    res.redirect("back");
  }
});

router.get(
  "/doctors", 
  isAuthenticated, 
  async (req, res) => {
  try {
    const patientId = req.user._id;

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

// PATIENT POST ROUTES

router.post("/bookappointment", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: Please log in." });
    }

    // Validate incoming data
    const { error, value } = appointmentSchema.validate(req.body);

    if (error) {
      const messages = error.details.map(err => err.message);
      req.flash("error", messages.join(", "));
      return res.redirect("/patient/bookappointment");
    }

    const patientId = req.user._id;
    const { doctorId, appointmentDate, timeSlot, reason } = value.patient;

    // Create and save the appointment
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
      attachments: []
    });

    const savedAppointment = await newAppointment.save();

    // Update doctor and patient records
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
