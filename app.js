const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const multer = require("multer");
const bodyParser = require("body-parser");
const PDFDocument = require('pdfkit');
const fs = require('fs');
require('dotenv').config();

const passport = require("passport");
const LocalStrategy = require("passport-local");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;

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
  secret: process.env.SECRET,
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
  // res.locals.currUser = req.user;
  next();
});

// // Google OAuth Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:5000/aarogyam/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       if (!profile.emails || profile.emails.length === 0) {
//         return done(new Error("No email associated with this Google account"));
//       }

//       const email = profile.emails[0].value;

//       // Check if user exists in Doctor or Patient collections
//       let user = await Doctor.findOne({ email }) || await Patient.findOne({ email });

//       if (!user) {
//         // Determine user type (Implement this function)
//         const userType = determineUserType(email);

//         if (userType === "doctor") {
//           user = new Doctor({
//             googleId: profile.id,
//             email,
//             username: profile.displayName,
//             profile: profile.photos?.[0]?.value || "", // Profile picture
//             role: "doctor",
//           });
//         } else {
//           user = new Patient({
//             googleId: profile.id,
//             email,
//             username: profile.displayName,
//             profile: profile.photos?.[0]?.value || "",
//             role: "patient",
//           });
//         }

//         await user.save();
//       }

//       return done(null, user);
//     }
//   )
// );

// // ✅ Single serializeUser & deserializeUser definition
// passport.serializeUser((user, done) => {
//   done(null, { id: user.id, type: user.constructor.modelName });
// });

// passport.deserializeUser(async (obj, done) => {
//   try {
//     const { id, type } = obj;
//     const Model = type === "Doctor" ? Doctor : Patient;
//     const user = await Model.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err);
//   }
// });

// // ✅ Implement this function to categorize users correctly
// function determineUserType(email) {
//   if (email.includes("hospital") || email.includes("clinic")) {
//     return "doctor";
//   }
//   return "patient";
// }

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

const authRouter = require("./routes/auth");

app.use("/auth", authRouter);

// // ✅ Login Route (Fixed)
// app.post("/login/:role", async (req, res, next) => {
//   const { role } = req.params;

//   if (role !== "doctor" && role !== "patient") {
//     return res.status(400).send("Invalid role specified");
//   }

//   passport.authenticate(`${role}-local`, async (err, user, info) => {
//     if (err) return next(err);
//     if (!user) return res.redirect("/login");

//     req.login(user, async (err) => {
//       if (err) return next(err);
//       return res.redirect(`/${role}/dashboard`);
//     });
//   })(req, res, next);
// });

// // ✅ Google OAuth Login Route
// app.get(
//   "/aarogyam/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// // ✅ Google OAuth Callback
// app.get(
//   "/aarogyam/auth/google/callback",
//   passport.authenticate("google", { failureRedirect: "/login" }),
//   (req, res) => {
//     // Redirect based on user type
//     if (req.user instanceof Doctor) {
//       return res.redirect("/doctor/dashboard");
//     } else {
//       return res.redirect("/patient/dashboard");
//     }
//   }
// );

// // ✅ Dashboard Route (Checks User Type)
// app.get("/dashboard", (req, res) => {
//   if (!req.isAuthenticated()) return res.redirect("/login");

//   if (req.user instanceof Doctor) {
//     return res.redirect("/doctor/dashboard");
//   } else {
//     return res.redirect("/patient/dashboard");
//   }
// });

// // ✅ Doctor Signup Route
// app.post("/signup/doctor", upload.single("profile"), async (req, res, next) => {
//   try {
//     const {
//       email,
//       username,
//       password,
//       specialization,
//       experience,
//       hospital,
//       consultantFees,
//       phone,
//     } = req.body.doctor;

//     const newDoctor = new Doctor({
//       email,
//       username,
//       specialization,
//       experience,
//       hospital,
//       consultantFees,
//       phone,
//       profile: req.file ? `/uploads/${req.file.filename}` : null, // Store image path
//     });

//     const registeredDoctor = await Doctor.register(newDoctor, password);

//     req.login(registeredDoctor, async (err) => {
//       if (err) return next(err);
//       res.redirect("/doctor/dashboard");
//     });
//   } catch (err) {
//     console.error("Error during doctor signup:", err);
//     res.redirect("/signup/doctor");
//   }
// });

// // ✅ Patient Signup Route
// app.post("/signup/patient", async (req, res, next) => {
//   try {
//     const { username, email, password, gender, age, height, weight, bloodType } =
//       req.body.patient;

//     const newPatient = new Patient({
//       username,
//       email,
//       gender,
//       age,
//       height,
//       weight,
//       bloodType,
//     });

//     const registeredPatient = await Patient.register(newPatient, password);

//     req.login(registeredPatient, (err) => {
//       if (err) return next(err);
//       res.redirect("/patient/dashboard");
//     });
//   } catch (error) {
//     console.error("Error registering patient:", error);
//     res.status(500).send("Error registering patient: " + error.message);
//   }
// });

// // ✅ Logout Route (Fixed)
// app.get("/logout", async (req, res, next) => {
//   try {
//     await req.logout();
//     req.session.destroy(() => {
//       res.redirect("/login");
//     });
//   } catch (err) {
//     console.error("Logout error:", err);
//     return next(err); // Pass error to Express error handler
//   }
// });

// ------------------------------------
// 🔹 PATIENT ROUTES
// ------------------------------------

const patientRouter = require("./routes/patient");

app.use("/patient", patientRouter);

// ------------------------------------
// 🔹 DOCTOR ROUTES
// ------------------------------------

// Serve certificates statically
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

const doctorRouter = require("./routes/doctor");

app.use("/doctor", doctorRouter);

// ------------------------------------
// 🔹 SERVER LISTENING
// ------------------------------------

const port = 5000;

app.listen(port, () => {
  console.log("Server is running on http://localhost:5000/aarogyam");
});
