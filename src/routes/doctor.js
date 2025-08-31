const express = require("express");
const router = express.Router();
const multer = require("multer");
const doctorController = require("../controllers/doctor");

const Doctor = require("../models/Doctor.js");
const Appointment = require("../models/Appointment");

// Configure multer for uploads
const storage = require("../config/cloudConfig.js").storage;
const upload = multer({ storage });

// GET routes
router.get("/dashboard", doctorController.dashboard);
router.get("/appointments", doctorController.appointments);
router.get("/patients", doctorController.patients);
router.get("/:doctorId/patient/:patientId/healthrecords", doctorController.healthRecords);
router.get("/:doctorId/patient/:patientId/prescriptions", doctorController.prescriptions);

// Combined routes using `router.route()`
// router
//   .route("/appointments/addAppointmentDetails/:id")
//   .get(doctorController.renderAddAppointmentDetails)
//   .post(
//     upload.fields([
//       { name: "patient[prescription]", maxCount: 1 },
//       { name: "patient[medicalReports]", maxCount: 5 },
//       { name: "patient[bill]", maxCount: 1 },
//     ]),
//     doctorController.addAppointmentDetails
//   );

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
    const { 
      fullName, 
      qualification, 
      specialization, 
      experience, 
      hospital, 
      consultantFees, 
      phone, 
      availabilitySlots 
    } = req.body.doctor;

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

    // Handle availability slots (if provided)
    if (availabilitySlots && Array.isArray(availabilitySlots)) {
      // sanitize: remove empty slots + past dates
      const today = new Date().toISOString().split("T")[0];

      const cleanSlots = availabilitySlots.filter(slot => {
        return (
          slot.date && 
          slot.startTime && 
          slot.endTime && 
          slot.date >= today   // only allow today or future
        );
      });

      updates.availabilitySlots = cleanSlots;
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      updates,
      { new: true, runValidators: true }
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

// Get doctor availability slots
router.get("/:doctorId/slots", async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.doctorId).lean();
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const now = new Date(); // current UTC instant
        let slots = doctor.availabilitySlots || [];

        // Filter only future slots (IST-based)
        slots = slots.filter(slot => {
            const slotDateTime = new Date(`${slot.date.toISOString().split("T")[0]}T${slot.startTime}:00+05:30`);
            return slotDateTime >= now;
        });

        // If a date query param is provided, filter slots by that date
        if (req.query.date) {
            const requestedDate = new Date(req.query.date).toISOString().split("T")[0];
            slots = slots.filter(slot =>
                new Date(slot.date).toISOString().split("T")[0] === requestedDate
            );
        }

        res.json({ slots });
    } catch (err) {
        console.error("Error fetching slots:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/filterappointments", async (req, res, next) => {
  try {
    const { search, date, status } = req.query;
    const doctorId = req.user._id;

    // Build filter
    let filter = { doctorId }; 
    if (date) filter.date = date;
    if (status) filter.status = status;

    // Query with doctor filter + populate
    let appointments = await Appointment.find(filter)
      .populate("patientId")
      .populate("doctorId"); // if you need doctor info for searching

    // Apply search filtering (without doctorName)
    if (search) {
      const searchLower = search.toLowerCase();

      appointments = appointments.filter((appointment) => {
        const patientName =
          appointment.patientId?.fullName || appointment.patientId?.username || "";

        return (
          patientName.toLowerCase().includes(searchLower) ||
          appointment.reason?.toLowerCase().includes(searchLower) ||
          appointment.disease?.toLowerCase().includes(searchLower)
        );
      });
    }

    res.render("doctor/appointments", { appointments });
  } catch (error) {
    console.error("Error filtering appointments:", error);
    req.flash("error", "Something went wrong while filtering appointments.");
    res.redirect(req.get("referer") || "/doctor/dashboard");
  }
});

router.get("/appointment/:appointmentId/prescription/:index", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect(req.get("referer") || "/doctor/dashboard");
    }
    const index = parseInt(req.params.index, 10);

    // Removing appointment of index from attachment
    if (index >= 0 && index < appointment.attachments.length) {
      appointment.attachments.splice(index, 1);
      await appointment.save();
      req.flash("success", "Attachment removed successfully.");
    } else {
      req.flash("error", "Invalid attachment index.");
    }

    res.redirect(req.get("referer") || "/doctor/dashboard");
  } catch (error) {
    console.error("Error removing attachment:", error);
    req.flash("error", "Something went wrong while removing the attachment.");
    res.redirect(req.get("referer") || "/doctor/dashboard");
  }});

  router.get("/appointment/:appointmentId/healthrecord/:index", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId).populate("healthrecord");
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect(req.get("referer") || "/doctor/dashboard");
    }

    const healthRecord = appointment.healthrecord;
    if (!healthRecord) {
      req.flash("error", "No health record found for this appointment.");
      return res.redirect(req.get("referer") || "/doctor/dashboard");
    }

    const index = parseInt(req.params.index, 10);

    if (index >= 0 && index < healthRecord.attachments.length) {
      // Remove the attachment at the given index
      healthRecord.attachments.splice(index, 1);
      await healthRecord.save();

      req.flash("success", "Medical report removed successfully.");
    } else {
      req.flash("error", "Invalid report index.");
    }

    res.redirect(req.get("referer") || "/doctor/dashboard");
  } catch (error) {
    console.error("Error removing medical report:", error);
    req.flash("error", "Something went wrong while removing the report.");
    res.redirect(req.get("referer") || "/doctor/dashboard");
  }
});

router.get("/appointment/:appointmentId/billing/:index", async (req, res) => {
  try {
    const { appointmentId, index } = req.params;

    // Find appointment with populated billing
    const appointment = await Appointment.findById(appointmentId).populate("billing");
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect(req.get("referer") || "/doctor/dashboard");
    }

    if (!appointment.billing) {
      req.flash("error", "No billing record associated with this appointment.");
      return res.redirect(req.get("referer") || "/doctor/dashboard");
    }

    const billing = appointment.billing;
    const attachmentIndex = parseInt(index, 10);

    // Remove attachment by index
    if (attachmentIndex >= 0 && attachmentIndex < billing.attachments.length) {
      billing.attachments.splice(attachmentIndex, 1);
      await billing.save();

      req.flash("success", "Billing attachment removed successfully.");
    } else {
      req.flash("error", "Invalid billing attachment index.");
    }

    res.redirect(req.get("referer") || "/doctor/dashboard");
  } catch (error) {
    console.error("Error removing billing attachment:", error);
    req.flash("error", "Something went wrong while removing the billing attachment.");
    res.redirect(req.get("referer") || "/doctor/dashboard");
  }
});

module.exports = router;
