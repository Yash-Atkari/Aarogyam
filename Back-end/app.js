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

const Doctor = require("./models/doctor"); // Adjust the path as needed
const Patient = require("./models/patient"); // Adjust the path as needed
const Appointment = require("./models/appointment"); // Adjust the path as needed

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

app.get("/", (req, res) => {
  res.send("Hi I am root go to dashboard /aarogyam")
});

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

app.get("/admin/signup", (req, res) => {
  res.render("auth/signup/admin");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get("/admin/dashboard", async (req, res) => {
  try {
    const patients = await Patient.find(); // Fetch all patients from DB
    const doctors = await Doctor.find(); // Fetch all doctors from DB
    const appointments = await Appointment.find()
      .populate({
        path: 'patientId',
        select: 'username' // Get the patient name
      })
      .populate({
        path: 'doctorId',
        select: 'username' // Get the doctor name
      });

    res.render("admin/dashboard", { patients, doctors, appointments });
  } catch (err) {
    console.error("Error fetching data for admin dashboard:", err);
    res.status(500).send("Internal Server Error");
  }
});

