const express = require("express");
const router = express.Router();
const multer = require("multer");

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const Appointment = require("../models/appointment");
const HealthRecord = require("../models/healthrecord");
const Billing = require("../models/billing");

const { isAuthenticated } = require("../middleware");

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure the "uploads" folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user._id);

    if (!doctor) {
      req.flash("error", "Doctor profile not found.");
      return res.redirect("/auth/login");
    }

    res.render("doctor/dashboard", { doctor });
  } catch (err) {
    console.error("Error fetching doctor data:", err);
    req.flash("error", "Unable to load dashboard. Please try again later.");
    res.redirect("/auth/login");
  }
});
  
router.get("/appointments", isAuthenticated, async (req, res) => {
  try {
      const doctorId = req.user._id;  // Ensure user is logged in
      const appointments = await Appointment.find({ doctorId }).populate("patientId");

      res.render("doctor/appointments", { appointments });
  } catch (err) {
      console.error("Error fetching doctor appointments:", err);
      req.flash("error", "Failed to load appointments. Please try again.");
      res.redirect("/doctor/dashboard");
  }
});
  
router.get("/appointments/addAppointmentDetails/:id", isAuthenticated, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId).populate("patientId");

    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect("/appointments"); // Prevent rendering with invalid data
    }

    res.render("doctor/addAppointment", { appointment });
  } catch (err) {
    console.error("Error fetching appointment:", err);
    req.flash("error", "Failed to load appointment details. Please try again.");
    res.redirect("/doctor/appointments"); // Redirecting to avoid broken pages
  }
});

router.get("/appointments/edit/:id", isAuthenticated, async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Fetch appointment data along with patient details
      const appointment = await Appointment.findById(appointmentId).populate("patientId");

      if (!appointment) {
          req.flash("error", "Appointment not found.");
          return res.redirect("/appointments");
      }

      // Fetch associated health record and billing data
      const healthRecord = await HealthRecord.findOne({ patientId: appointment.patientId });
      const billing = await Billing.findOne({ patientId: appointment.patientId });

      // Render edit page with existing data
      res.render("doctor/editAppointment", {
          appointment,
          healthRecord,
          billing,
      });

  } catch (err) {
      console.error("Error fetching data for edit:", err);
      req.flash("error", "Failed to load appointment details. Please try again.");
      res.redirect("/doctor/appointments"); // Redirecting to avoid broken pages
  }
});

  
router.get("/patients", isAuthenticated, async (req, res) => {
  try {
      const doctorId = req.user._id;

      // Fetch doctor along with their patients
      const doctor = await Doctor.findById(doctorId).populate("patients");

      if (!doctor) {
          req.flash("error", "Doctor not found.");
          return res.redirect("/doctor/dashboard");
      }

      res.render("doctor/patients", { doctor });

  } catch (err) {
      console.error("Error fetching patients:", err);
      req.flash("error", "Failed to load patients. Please try again.");
      res.redirect("/doctor/dashboard"); // Redirecting to avoid broken pages
  }
});

router.get("/patient/:id/healthrecords", isAuthenticated, async (req, res) => {
  try {
      const patientId = req.params.id;

      // Fetch patient details
      const patient = await Patient.findById(patientId);
      if (!patient) {
          req.flash("error", "Patient not found.");
          return res.redirect("/doctor/patients");
      }

      // Fetch health records for the patient
      const healthrecords = await HealthRecord.find({ patientId });
      
      res.render("doctor/healthrecords", { healthrecords, patient });
  } catch (error) {
      console.error("Error fetching health records:", error);
      req.flash("error", "Failed to load health records. Please try again.");
      res.redirect("/doctor/dashboard");
  }
});

  
router.get("/:doctorId/patient/:patientId/prescriptions", isAuthenticated, async (req, res) => {
  try {
      const { doctorId, patientId } = req.params;

      // Ensure the logged-in doctor is accessing their own patients' prescriptions
      if (doctorId !== req.user._id.toString()) {
          req.flash("error", "Unauthorized access.");
          return res.redirect("/doctor/dashboard");
      }

      // Fetch the patient details
      const patient = await Patient.findById(patientId);
      if (!patient) {
          req.flash("error", "Patient not found.");
          return res.redirect("/doctor/patients");
      }

      // Fetch all appointments between this doctor and patient
      const appointments = await Appointment.find({ doctorId, patientId })
          .populate("attachments"); // Attachments contain prescriptions

      res.render("doctor/prescriptions", { appointments, patient });
  } catch (error) {
      console.error("Error fetching prescriptions:", error);
      req.flash("error", "Failed to load prescriptions. Please try again.");
      res.redirect("/doctor/dashboard");
  }
});
  
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

router.post("/generate-certificate/:patientId", isAuthenticated, async (req, res) => {
    try {
        const { admissionDate, dischargeDate } = req.body;
        const patient = await Patient.findById(req.params.patientId).populate("doctors");

        if (!patient) {
            req.flash("error", "Patient not found.");
            return res.redirect("/doctor/dashboard");
        }

        const fileName = `medical_certificate_${patient._id}.pdf`;
        const certificatesDir = path.join(__dirname, "../public/certificates");
        const filePath = path.join(certificatesDir, fileName);

        // Ensure 'certificates' directory exists
        if (!fs.existsSync(certificatesDir)) {
            fs.mkdirSync(certificatesDir, { recursive: true });
        }

        // Create PDF document
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // PDF Content
        doc.fontSize(20).text("Medical Leave Certificate", { align: "center" }).moveDown();
        doc.fontSize(12).text(`Patient Name: ${patient.username}`);
        doc.text(`Email: ${patient.email}`);
        doc.text(`Gender: ${patient.gender}`);
        doc.text(`Age: ${patient.age}`);
        doc.text(`Blood Type: ${patient.bloodType}`);
        doc.text(`Doctor: ${patient.doctors[0]?.name || "N/A"}`);
        doc.text(`Admission Date: ${admissionDate}`);
        doc.text(`Discharge Date: ${dischargeDate}`);
        doc.moveDown();
        doc.text(`This is to certify that ${patient.username} was admitted from ${admissionDate} to ${dischargeDate} and requires medical leave.`);

        // Signature Placeholder
        doc.moveDown();
        doc.text("_________________________");
        doc.text("Doctor's Signature");

        doc.end();

        stream.on("finish", () => {
            req.flash("success", "Medical certificate generated successfully.");
            res.redirect(`/doctor/patients/${patient._id}`);
        });

        stream.on("error", (err) => {
            console.error("Error generating certificate:", err);
            req.flash("error", "Error generating certificate. Please try again.");
            res.redirect(`/doctor/patients/${patient._id}`);
        });

    } catch (error) {
        console.error("Server error:", error);
        req.flash("error", "Internal server error.");
        res.redirect("/doctor/dashboard");
    }
});
  
  // ------------------------------------
  // 🔹 DOCTOR POST ROUTES
  // ------------------------------------
  
  router.post(
    "/appointments/addAppointmentDetails/:id",
    isAuthenticated,  // Ensuring only logged-in users can access
    upload.fields([
        { name: "patient[prescription]", maxCount: 1 },
        { name: "patient[medicalReports]", maxCount: 5 },
        { name: "patient[bill]", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const appointmentId = req.params.id;
            const { username, email, gender, appointmentDate, timeSlot, symptoms, disease } = req.body.patient;

            // Find appointment
            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                req.flash("error", "Appointment not found.");
                return res.redirect("/doctor/appointments");
            }

            // Extract uploaded file paths
            const prescriptionUrl = req.files["patient[prescription]"]?.[0]?.path || null;
            const medicalReports = req.files["patient[medicalReports]"]?.map(file => file.path) || [];
            const billUrl = req.files["patient[bill]"]?.[0]?.path || null;

            // Update appointment details
            appointment.disease = disease;
            appointment.summary = symptoms;
            if (prescriptionUrl) {
                appointment.attachments.push(prescriptionUrl);
            }
            await appointment.save();

            // Create new health record
            const healthRecord = new HealthRecord({
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                disease,
                symptoms,
                attachments: medicalReports,
            });
            await healthRecord.save();

            // Create new billing record
            const invoiceNo = `INV-${Math.floor(Math.random() * 9000) + 1000}`;
            const billing = new Billing({
                patientId: appointment.patientId,
                doctorId: appointment.doctorId,
                invoiceNo,
                date: new Date(),
                amount: 0, // To be updated later
                reason: disease,
                status: "paid",
                paymentMethod: "cash",
                attachments: billUrl ? [billUrl] : [],
            });
            await billing.save();

            req.flash("success", "Appointment details added successfully.");
            res.redirect("/doctor/appointments");

        } catch (err) {
            console.error("Error updating records:", err);
            req.flash("error", "An error occurred while updating appointment details.");
            res.redirect("/doctor/appointments");
        }
    }
);

router.post(
  "/appointments/edit/:id",
  isAuthenticated, // Ensures only logged-in users can edit
  upload.fields([
      { name: "patient[prescription]", maxCount: 1 },
      { name: "patient[medicalReports]", maxCount: 5 },
      { name: "patient[bill]", maxCount: 1 },
  ]),
  async (req, res) => {
      try {
          const appointmentId = req.params.id;
          const { symptoms, disease } = req.body.patient;

          // Validate required fields
          if (!disease || !symptoms) {
              req.flash("error", "Disease and symptoms are required.");
              return res.redirect("/doctor/appointments");
          }

          // Extract uploaded file paths safely
          const prescriptionUrl = req.files?.["patient[prescription]"]?.[0]?.path || null;
          const medicalReports = req.files?.["patient[medicalReports]"]?.map(file => file.path) || [];
          const billUrl = req.files?.["patient[bill]"]?.[0]?.path || null;

          // Find and update appointment
          const appointment = await Appointment.findById(appointmentId);
          if (!appointment) {
              req.flash("error", "Appointment not found.");
              return res.redirect("/doctor/appointments");
          }

          appointment.disease = disease;
          appointment.summary = symptoms;
          if (prescriptionUrl) {
              appointment.attachments = [prescriptionUrl]; // Replace previous prescription
          }
          await appointment.save();

          // Find and update health record
          const healthRecord = await HealthRecord.findOne({ patientId: appointment.patientId });
          if (healthRecord) {
              healthRecord.disease = disease;
              healthRecord.symptoms = symptoms;
              if (medicalReports.length > 0) {
                  healthRecord.attachments = medicalReports;
              }
              await healthRecord.save();
          }

          // Find and update billing record
          const billing = await Billing.findOne({ patientId: appointment.patientId });
          if (billing) {
              billing.reason = disease;
              if (billUrl) {
                  billing.attachments = [billUrl]; // Replace previous bill attachment
              }
              await billing.save();
          }

          req.flash("success", "Appointment details updated successfully.");
          res.redirect("/doctor/appointments");

      } catch (err) {
          console.error("Error updating records:", err);
          req.flash("error", "Internal Server Error while updating appointment.");
          res.redirect("/doctor/appointments");
      }
  }
);

router.post("/appointments/confirm/:id", isAuthenticated, async (req, res) => {
  try {
      const appointmentId = req.params.id;

      // Find the appointment by ID
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
          req.flash("error", "Appointment not found.");
          return res.redirect("/doctor/appointments");
      }

      // Update appointment status to "confirmed"
      appointment.status = "confirmed";
      await appointment.save();

      // Update doctor's patients array
      await Doctor.findByIdAndUpdate(appointment.doctorId, {
          $addToSet: { patients: appointment.patientId } // Ensures no duplicates
      });

      // Update patient's doctors array
      await Patient.findByIdAndUpdate(appointment.patientId, {
          $addToSet: { doctors: appointment.doctorId } // Ensures no duplicates
      });

      req.flash("success", "Appointment confirmed successfully.");
      res.redirect("/doctor/appointments");

  } catch (err) {
      console.error("Error confirming appointment:", err);
      req.flash("error", "Internal Server Error while confirming appointment.");
      res.redirect("/doctor/appointments");
  }
});

module.exports = router;
