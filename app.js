const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const flash = require("connect-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const multer = require("multer");
const bodyParser = require("body-parser");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.engine('ejs', engine);
app.use(methodOverride("_method"));
app.use('/uploads', express.static('uploads'));

// -----------------------------------
// 🔹 MODELS
// -----------------------------------

const Doctor = require("./models/doctor");
const Patient = require("./models/patient");
const Appointment = require("./models/appointment");
const HealthRecord = require("./models/healthrecord"); 
const Billing = require("./models/billing");

// -----------------------------------
// 🔹 MONGODB CONNECTION
// -----------------------------------

const MongoUrl = "mongodb://127.0.0.1:27017/aarogyam";

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("Error:", err));

async function main() {
  await mongoose.connect(MongoUrl);
}

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

const sessionOptions = {
  secret: "mysecretstring",
  resave: false,
  saveUninitialized: true,
  cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
  }
};

app.use(session(sessionOptions));
// app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// Configure Passport for Doctor authentication
passport.use('doctor-local', new LocalStrategy(Doctor.authenticate()));
passport.serializeUser(Doctor.serializeUser());
passport.deserializeUser(Doctor.deserializeUser());

// Configure Passport for Patient authentication
passport.use('patient-local', new LocalStrategy(Patient.authenticate()));
passport.serializeUser(Patient.serializeUser());
passport.deserializeUser(Patient.deserializeUser());

// app.use((req, res, next) => {
//   res.locals.success = req.flash("success");
//   res.locals.error = req.flash("error");
//   next();
// });

// -----------------------------------
// 🔹 HOME PAGE
// -----------------------------------

app.get("/aarogyam", (req, res) => res.render("dashboard"));

// -----------------------------------
// 🔹 AUTH ROUTES
// -----------------------------------

app.get("/login", (req, res) => res.render("auth/login/login"));
app.get("/signup", (req, res) => res.render("auth/signup/signup"));

app.get("/signup/doctor", (req, res) => res.render("auth/signup/doctor"));
app.get("/signup/patient", (req, res) => res.render("auth/signup/patient"));

app.post("/login", passport.authenticate("local", {
  failureRedirect: "/login",
  failureFlash: true
}), (req, res) => {
  if (req.user.role === "doctor") {
      res.redirect("/dashboard/doctor");
  } else {
      res.redirect("/dashboard/patient");
  }
});

// Doctor Signup Route
app.post("/signup/doctor", upload.single("profile"), async (req, res) => {
  try {
      // Extract doctor details from form submission
      const { email, username, password, specialization, experience, hospital, consultantFees, phone } = req.body.doctor;

      // Create new Doctor instance
      const newDoctor = new Doctor({
          email,
          username,
          specialization,
          experience,
          hospital,
          consultantFees,
          phone,
          profile: req.file ? `/uploads/${req.file.filename}` : null  // Store image path
      });

      // Register doctor with hashed password
      await Doctor.register(newDoctor, password);

      // Authenticate and log in user after signup
      req.login(newDoctor, (err) => {
          if (err) return next(err);
          res.render("doctor/dashboard");  // Redirect after successful signup
      });
  } catch (err) {
      console.error("Error during doctor signup:", err);
      res.redirect("/signup/doctor");  // Redirect back to signup form on failure
  }
});

app.post("/signup/patient", async (req, res) => {
  try {
      const { username, email, password, gender, age, height, weight, bloodType } = req.body.patient;
      const newPatient = new Patient({ username, email, gender, age, height, weight, bloodType });
      const registeredPatient = await Patient.register(newPatient, password);
      req.login(registeredPatient, (err) => {
          if (err) return next(err);
          res.redirect("/patient/dashboard");
      });
  } catch (error) {
      res.status(500).send("Error registering patient: " + error.message);
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
      if (err) {
          console.error("Logout error:", err);
          return res.redirect("/"); // Redirect to home or login page
      }
      req.session.destroy(() => {
          res.redirect("/login"); // Redirect after session is cleared
      });
  });
});

// ------------------------------------
// 🔹 PATIENT ROUTES
// ------------------------------------

app.get("/patient/dashboard", async (req, res) => {
  try {
    const patientId = req.user && req.user._id ? req.user._id : "67b6d14db339e23694c73bf9";
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    res.render("patient/dashboard", { patient });
  } catch (err) {
    console.error("Error fetching patient data:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/todaysappointments", async (req, res) => {
  try {
    const patientId = req.user && req.user._id ? req.user._id : "67b6d14db339e23694c73bf9";
    const appointments = await Appointment.find({ patientId })
      .populate("patientId")
      .populate("doctorId");

    res.render("patient/appointments/todaysappointments", { appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Appointment cancel route

app.delete("/patient/todaysappointments/cancel/:id", async (req, res) => {
  try {
      const { id } = req.params // Default ID if `id` is undefined
      const deletedAppointment = await Appointment.findByIdAndDelete(id);

      // req.flash("success", "Appointment canceled successfully!");
      res.redirect("/patient/todaysappointments");
  } catch (error) {
      console.error("Error canceling appointment:", error);
      // req.flash("error", "Internal Server Error");
      res.redirect("/patient/todaysappointments");
  }
});

app.get("/patient/bookappointment", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.render("patient/appointments/bookappointment", { doctors });
  } catch (err) {
    console.error("Error rendering appointment booking page:", err);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.get("/patient/healthrecords", async (req, res) => {
  try {
    const patientId = req.user && req.user._id ? req.user._id : "67b6d14db339e23694c73bf9";
    const records = await HealthRecord.find({ patientId })
    .populate("doctorId");

    res.render("patient/healthrecords", { records });
  } catch (err) {
    console.error("Error fetching health records:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/prescriptions", async (req, res) => {
  try {
    const patientId = req.user && req.user._id ? req.user._id : "67b6d14db339e23694c73bf9";
    const appointments = await Appointment.find({ patientId: patientId }).populate("doctorId");

    res.render("patient/prescriptions", { appointments });
  } catch (err) {
    console.error("Error fetching prescriptions:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Prescription delete route

app.post('/patient/prescriptions/delete/:id', async (req, res) => {
  try {
      const appointmentId = req.params.id;
      const filePath = req.query.file; // Get file path from query params

      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);

      // Remove the file from attachments array
      appointment.attachments = appointment.attachments.filter(file => file !== filePath);

      // Save updated appointment
      await appointment.save();

      // req.flash('success', 'Prescription deleted successfully.');
      res.redirect('back'); // Redirect to the same page
  } catch (error) {
      console.error('Error deleting prescription:', error);
      // req.flash('error', 'Something went wrong.');
      res.redirect('back');
  }
});

app.get("/patient/billings", async (req, res) => {
  try {
    const patientId = req.user && req.user._id ? req.user._id : "67b6d14db339e23694c73bf9";
    const bills = await Billing.find({ patientId: patientId }).populate("doctorId");

    res.render("patient/billings", { bills });
  } catch (err) {
    console.error("Error fetching billings:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Billing delete route

app.post('/patient/billings/delete/:id', async (req, res) => {
  try {
      const billingId = req.params.id;
      const filePath = req.query.file; // Get file path from query params

      // Find the appointment
      const billing = await Billing.findById(billingId);

      // Remove the file from attachments array
      billing.attachments = billing.attachments.filter(file => file !== filePath);

      // Save updated appointment
      await billing.save();

      // req.flash('success', 'Prescription deleted successfully.');
      res.redirect('back'); // Redirect to the same page
  } catch (error) {
      console.error('Error deleting prescription:', error);
      // req.flash('error', 'Something went wrong.');
      res.redirect('back');
  }
});

app.get("/patient/doctors", async (req, res) => {
  try {
      const patientId = req.user ? req.user._id : "67b6d14db339e23694c73bf9"; // Get from req.user or default

      const patient = await Patient.findById(patientId).populate("doctors"); // Populate doctors field

      if (!patient) {
          return res.status(404).send("Patient not found");
      }

      // console.log(patient.doctors);

      res.render("patient/doctors", { doctors: patient.doctors });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});

// ------------------------------------
// 🔹 PATIENT POST ROUTES
// ------------------------------------

app.post("/bookappointment", /* isAuthenticated */ async (req, res) => {
  try {
      // Extract the logged-in patient's ID
      const patientId = req.user && req.user._id ? req.user._id : "67b6d14db339e23694c73bf9"; // Assuming user is stored in req.user by Passport.js
    
      // Extract required form data
      const { doctorId, appointmentDate, timeSlot, reason } = req.body.patient;

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
          attachments: []
      });

      await newAppointment.save();
      
      // req.flash("success", "Appointment booked successfully!");
      res.redirect("/patient/bookappointment");
  } catch (error) {
      console.error("Error booking appointment:", error);
      // req.flash("error", "Failed to book appointment. Please try again.");
      res.status(500).json({ message: "Internal Server Error" });
  }
});

// ------------------------------------
// 🔹 DOCTOR ROUTES
// ------------------------------------

app.get("/doctor/dashboard", async (req, res) => {
  try {
    const doctorId = req.user && req.user._id ? req.user._id : "67b6d17ab339e23694c73bfb";
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    // console.log(doctorId);
    // console.log(doctor);
    res.render("doctor/dashboard", { doctor });
  } catch (err) {
    console.error("Error fetching doctor data:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/doctor/appointments", async (req, res) => {
  try {
    const doctorId = "67b6d17ab339e23694c73bfb";  // Change to dynamic session-based ID
    const appointments = await Appointment.find({ doctorId })
      .populate("patientId")

    res.render("doctor/appointments", { appointments });
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/doctor/appointments/addAppointmentDetails/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId).populate("patientId");

    // if (!appointment) {
    //   return res.status(404).json({ error: "Appointment not found" });
    // }

    res.render("doctor/addAppointment", { appointment });
  } catch (err) {
    console.error("Error fetching appointment:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/doctor/appointments/edit/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Fetch appointment, health record, and billing data
    const appointment = await Appointment.findById(appointmentId)
    .populate("patientId");
    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    const healthRecord = await HealthRecord.findOne({ patientId: appointment.patientId });
    const billing = await Billing.findOne({ patientId: appointment.patientId });

    // Render the edit form with existing data
    res.render("doctor/editAppointment", {
      appointment,
      healthRecord,
      billing,
    });
  } catch (err) {
    console.error("Error fetching data for edit:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/doctor/patients", async (req, res) => {
  try {
    const doctorId = req.user?._id || "67b6d17ab339e23694c73bfb"; // Set default ID if req.user._id is missing

    const doctor = await Doctor.findById(doctorId).populate("patients");

    if (!doctor) {
      return res.status(404).send("Doctor not found");
    }

    // console.log(doctor.patients);

    res.render("doctor/patients", { patients: doctor.patients });
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/doctor/patient/:id/healthrecords", async (req, res) => {
  try {
      const patient = await Patient.findById(req.params.id)
      .populate("healthRecord");

      if (!patient) {
          return res.status(404).send("Patient not found");
      }

      // console.log(patient);

      res.render("doctor/healthrecords", { patient });
  } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
  }
});

app.get("/doctor/patient/:id/prescriptions", async (req, res) => {
  try {
      const patient = await Patient.findById(req.params.id)
      .populate("appointments");

      if (!patient) {
        return res.status(404).send("Patient not found");
      }

      res.render("doctor/prescriptions", { patient });
  } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
  }
});

// ------------------------------------
// 🔹 DOCTOR POST ROUTES
// ------------------------------------

app.post(
  "/doctor/appointments/addAppointmentDetails/:id",
  upload.fields([
    { name: "patient[prescription]", maxCount: 1 },
    { name: "patient[medicalReports]", maxCount: 5 },
    { name: "patient[bill]", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const appointmentId = req.params.id;
      
      const { username, email, gender, appointmentDate, timeSlot, symptoms, disease } = req.body.patient;

      // Extract file paths
      const prescriptionUrl = req.files["patient[prescription]"]
        ? req.files["patient[prescription]"][0].path
        : null;
      const medicalReports = req.files["patient[medicalReports]"]
        ? req.files["patient[medicalReports]"].map((file) => file.path)
        : [];
      const billUrl = req.files["patient[bill]"]
        ? req.files["patient[bill]"][0].path
        : null;

      // Find appointment and update fields
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      appointment.disease = disease;
      appointment.summary = symptoms;
      if (prescriptionUrl) {
        appointment.attachments.push(prescriptionUrl);
      }
      const updatedAppointment = await appointment.save();

      // console.log(updatedAppointment);

      // Create new health record
      const healthRecord = new HealthRecord({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        disease: disease,
        symptoms: symptoms,
        attachments: medicalReports,
      });
      await healthRecord.save();

      // console.log(healthRecord);

      // Create new billing record
      const invoiceNo = `INV-${Math.floor(Math.random() * 9000) + 1000}`;
      const billing = new Billing({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        invoiceNo: invoiceNo,
        date: new Date(),
        amount: 0, // To be updated later
        reason: disease,
        status: "paid",
        paymentMethod: "cash",
        attachments: billUrl ? [billUrl] : [],
      });
      await billing.save();

      // console.log(billing);

      res.redirect("/doctor/appointments");
    } catch (err) {
      console.error("Error updating records:", err);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  }
);

app.post(
  "/doctor/appointments/edit/:id",
  upload.fields([
    { name: "patient[prescription]", maxCount: 1 },
    { name: "patient[medicalReports]", maxCount: 5 },
    { name: "patient[bill]", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const appointmentId = req.params.id;
      const { symptoms, disease } = req.body.patient;

      if (!disease || !symptoms) {
        return res.status(400).json({ error: "Disease and symptoms are required" });
      }

      // Extract file paths safely
      const prescriptionUrl = req.files?.["patient[prescription]"]?.[0]?.path || null;
      const medicalReports = req.files?.["patient[medicalReports]"]
        ? req.files["patient[medicalReports]"].map((file) => file.path)
        : [];
      const billUrl = req.files?.["patient[bill]"]?.[0]?.path || null;

      // Find and update appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      appointment.disease = disease;
      appointment.summary = symptoms;
      if (prescriptionUrl) {
        appointment.attachments = []; // Empty the array
        appointment.attachments.push(prescriptionUrl);
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
          billing.attachments = [billUrl];
        }
        await billing.save();
      }

      res.redirect("/doctor/appointments");
    } catch (err) {
      console.error("Error updating records:", err);
      res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
  }
);

app.post("/doctor/appointments/confirm/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Find the appointment by ID
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Update the status to 'confirmed'
    appointment.status = "confirmed";
    await appointment.save();

    res.redirect("/doctor/appointments");
  } catch (err) {
    console.error("Error confirming appointment:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// ------------------------------------
// 🔹 SERVER LISTENING
// ------------------------------------
const port = 5000;
app.listen(port, () => {
  console.log("Server is running on http://localhost:5000/aarogyam");
});
