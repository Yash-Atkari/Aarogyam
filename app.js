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
    req.user = "67b6d14db339e23694c73bf9";

    const healthrecords = await HealthRecord.find({patientId: req.user});
    const doctors = await Doctor.find({});
    const appointments = await Appointment.find({ patientId: req.user});

    // console.log(healthrecords);
    // console.log(doctors);
    // console.log(appointments);

    
  } catch (err) {
    console.error("Error fetching patient data:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
  res.render("patient/dashboard");
});

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000/aarogyam`);
});
