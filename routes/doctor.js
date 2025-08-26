const express = require("express");
const router = express.Router();
const multer = require("multer");
const doctorController = require("../controllers/doctor");

const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");

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

        let slots = doctor.availabilitySlots || [];

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

    // Apply search filtering
    if (search) {
      const searchLower = search.toLowerCase();
      appointments = appointments.filter((appointment) =>
        (appointment.patientId?.fullName?.toLowerCase().includes(searchLower)) ||
        (appointment.reason?.toLowerCase().includes(searchLower)) ||
        (appointment.disease?.toLowerCase().includes(searchLower))
      );
    }

    res.render("doctor/appointments", { appointments });
  } catch (error) {
    console.error("Error filtering appointments:", error);
    req.flash("error", "Something went wrong while filtering appointments.");
    res.redirect(req.get("referer") || "/doctor/dashboard");
  }
});

module.exports = router;
