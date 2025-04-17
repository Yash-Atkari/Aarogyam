if(process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const methodOverride = require("method-override");
const multer = require("multer");
const bodyParser = require("body-parser");
const PDFDocument = require('pdfkit');
const fs = require('fs');

const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError");

const app = express();

// Serve certificates statically
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.engine('ejs', engine);
app.use(methodOverride("_method"));
app.use('/uploads', express.static('uploads'));

// MODELS

const Doctor = require("./models/doctor");
const Patient = require("./models/patient");
const Appointment = require("./models/appointment");
const HealthRecord = require("./models/healthrecord"); 
const Billing = require("./models/billing");

// MONGODB CONNECTION

// const MongoUrl = "mongodb://127.0.0.1:27017/aarogyam";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("Error:", err));

async function main() {
  await mongoose.connect(dbUrl);
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

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
      secret: "process.env.SECRET",
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE");
});

const sessionOptions = {
  store,
  secret: "process.env.SECRET",
  resave: false,
  saveUninitialized: true,
  cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
  }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// Configure Passport for Doctor authentication
passport.use("doctor-local", new LocalStrategy(Doctor.authenticate()));
passport.use("patient-local", new LocalStrategy(Patient.authenticate()));

// 🛠️ Custom serializeUser & deserializeUser to distinguish user types
passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user instanceof Doctor ? "doctor" : "patient" });
});

passport.deserializeUser(async (data, done) => {
  try {
    if (data.role === "doctor") {
      const doctor = await Doctor.findById(data.id);
      done(null, doctor);
    } else {
      const patient = await Patient.findById(data.id);
      done(null, patient);
    }
  } catch (err) {
    done(err);
  }
});

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.danger = req.flash("danger");
  res.locals.currUser = req.user;
  next();
});

// HOME PAGE

app.get("/aarogyam", (req, res) => res.render("dashboard"));

// AUTH ROUTES

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

// PATIENT ROUTES

const patientRouter = require("./routes/patient");
app.use("/patient", patientRouter);

// DOCTOR ROUTES

const doctorRouter = require("./routes/doctor");
app.use("/doctor", doctorRouter);

// ERROR HANDLER

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode=500, message="Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { err });
});

// SERVER LISTENING

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
