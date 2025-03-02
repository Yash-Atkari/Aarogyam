const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const flash = require("connect-flash");
const session = require("express-session");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.engine('ejs', engine);

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

// const sessionOptions = {
//   store,
//   secret: process.env.SECRET,
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//       expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//       httpOnly: true,
//   }
// };

// app.use(session(sessionOptions));
// app.use(flash());

// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

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
app.get("/doctor/signup", (req, res) => res.render("auth/signup/doctor"));
app.get("/patient/signup", (req, res) => res.render("auth/signup/patient"));

// ------------------------------------
// 🔹 PATIENT ROUTES
// ------------------------------------

app.get("/patient/dashboard", async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    res.render("patient/dashboard", { patient });
  } catch (err) {
    console.error("Error fetching patient data:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/appointments", async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";
    const appointments = await Appointment.find({ patientId })
      .populate("patientId")
      .populate("doctorId");

    res.render("patient/appointments/todaysappointments", { appointments });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
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
    const patientId = "67b6d14db339e23694c73bf9";
    const records = await HealthRecord.find({ patientId });

    res.render("patient/healthrecords", { records });
  } catch (err) {
    console.error("Error fetching health records:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/prescriptions", async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";
    const appointments = await Appointment.find({ patientId: patientId }).populate("doctorId");

    res.render("patient/prescriptions", { appointments });
  } catch (err) {
    console.error("Error fetching prescriptions:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/billings", async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";
    const bills = await Billing.find({ patientId: patientId }).populate("doctorId");

    res.render("patient/billing", { bills });
  } catch (err) {
    console.error("Error fetching billings:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
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
    const doctorId = "67b6d17ab339e23694c73bfb"; // Change to dynamic session-based ID
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

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

// ------------------------------------
// 🔹 SERVER LISTENING
// ------------------------------------

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000/patient/dashboard");
});
