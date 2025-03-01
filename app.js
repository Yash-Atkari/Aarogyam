const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.engine('ejs', engine);

const Doctor = require("./models/doctor");
const Patient = require("./models/patient");
const Appointment = require("./models/appointment");
const HealthRecord = require("./models/healthrecord"); 
const appointment = require("./models/appointment");

const MongoUrl = "mongodb://127.0.0.1:27017/aarogyam";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Error:", err);
  });

async function main() {
  await mongoose.connect(MongoUrl);
}

app.get("/aarogyam", (req, res) => {
  res.render("dashboard");
});

app.get("/login", (req, res) => {
  res.render("auth/login/login");
});

app.get("/signup", (req, res) => {
  res.render("auth/signup/signup");
});

app.get("/doctor/signup", (req, res) => {
  res.render("auth/signup/doctor");
});

app.get("/patient/signup", (req, res) => {
  res.render("auth/signup/patient");
});

// app.get("/admin/signup", (req, res) => {
//   res.render("auth/signup/admin");
// });

// app.get("/admin/dashboard", async (req, res) => {
//   res.render("admin/dashboard");
// });

// app.get("/doctor/dashboard", async (req, res) => {
//   res.render("doctor/dashboard");
// });

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
    const appointments = await Appointment.find({patientId: patientId})
    .populate("patientId")  // Populating patient details
    .populate("doctorId");  // Populating doctor details

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
    console.error("Error rendering the appointment booking page:", err);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

app.get("/patient/healthrecords", async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";
    const records = await HealthRecord.find({patientId: patientId});

    res.render("patient/healthrecords", { records });
  } catch (err) {
    console.error("Error fetching health records:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/prescriptions", async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";

    // Fetch only Prescription records with attachments
    const appointments = await Appointment.find({ patientId: patientId })
    .populate("doctorId"); // Populates doctor details

    res.render("patient/prescriptions", { appointments });
  } catch (err) {
    console.error("Error fetching prescriptions:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

app.get("/patient/billing",async (req, res) => {
  try {
    const patientId = "67b6d14db339e23694c73bf9";

    // Fetch only Prescription records with attachments
    const records = await HealthRecord.find({ patientId: patientId });

    res.render("patient/biling", { records });
  } catch (err) {
    console.error("Error fetching prescriptions:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// app.get("/patient/doctors", async (req, res) => {
//   try {
//     const doctors = await Doctor.find();
//     res.render("patient/doctors", { doctors });
//   } catch (err) {
//     console.error("Error fetching doctors:", err);
//     res.status(500).json({ error: "Internal Server Error", details: err.message });
//   }
// });

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000/patient/dashboard");
});
