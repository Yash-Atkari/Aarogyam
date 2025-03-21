const express = require("express");
const router = express.Router();
const multer = require("multer");

const passport = require("passport");

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");

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

router.get("/login", (req, res) => res.render("auth/login/login"));
router.get("/signup", (req, res) => res.render("auth/signup/signup"));

router.get("/signup/doctor", (req, res) => res.render("auth/signup/doctor"));
router.get("/signup/patient", (req, res) => res.render("auth/signup/patient"));

// Login

router.post("/login", async (req, res, next) => {
  try {
    const { username } = req.body;

    // Check if the user exists as a Doctor
    const doctor = await Doctor.findOne({ username });
    if (doctor) {
      return passport.authenticate("doctor-local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("error", "Invalid username or password");
          return res.redirect("/auth/login"); // Failed login
        }

        req.logIn(user, async (err) => {
          if (err) return next(err);
          req.flash("success", "Welcome back to Aarogyam!");
          return res.redirect("/doctor/dashboard");
        });
      })(req, res, next);
    }

    // Check if the user exists as a Patient
    const patient = await Patient.findOne({ username });
    if (patient) {
      return passport.authenticate("patient-local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("error", "Invalid username or password");
          return res.redirect("/auth/login"); // Failed login
        }

        req.logIn(user, async (err) => {
          if (err) return next(err);
          req.flash("success", "Welcome back to Aarogyam!");
          return res.redirect("/patient/dashboard");
        });
      })(req, res, next);
    }

    // If neither doctor nor patient is found
    req.flash("error", "Invalid username or password");
    return res.redirect("/auth/login");
  } catch (error) {
    console.error("Error during login:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/auth/login");
  }
});

// Doctor signup route

router.post("/signup/doctor", upload.single("profile"), async (req, res, next) => {
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
    req.login(newDoctor, async (err) => {
      if (err) {
        req.flash("error", "Something went wrong during login. Please try again.");
        return next(err);
      }

      // Fetch the doctor from the database using req.user._id
      const doctor = await Doctor.findById(req.user._id);

      if (!doctor) {
        req.flash("error", "Doctor not found. Please sign up again.");
        return res.redirect("/auth/signup/doctor"); // Redirect if doctor is not found
      }

      req.flash("success", "Welcome to Aarogyam, Doctor!");
      return res.redirect("/doctor/dashboard"); // Redirect to dashboard with success message
    });
  } catch (err) {
    console.error("Error during doctor signup:", err);
    req.flash("error", "Signup failed. Please check your details and try again.");
    return res.redirect("/auth/signup/doctor"); // Redirect back to signup form on failure
  }
});

// Patient signup route

router.post("/signup/patient", async (req, res, next) => {
  try {
    const { username, email, password, gender, age, height, weight, bloodType } = req.body.patient;

    // Create new Patient instance
    const newPatient = new Patient({ username, email, gender, age, height, weight, bloodType });

    // Register patient with hashed password
    const registeredPatient = await Patient.register(newPatient, password);

    // Authenticate and log in user after signup
    req.login(registeredPatient, (err) => {
      if (err) {
        req.flash("error", "Something went wrong during login. Please try again.");
        return next(err);
      }

      req.flash("success", "Welcome to Aarogyam!");
      return res.redirect("/patient/dashboard");
    });
  } catch (error) {
    console.error("Error registering patient:", error);
    req.flash("error", "Signup failed. Please check your details and try again.");
    return res.redirect("/auth/signup/patient"); // Redirect back to signup form on failure
  }
});

// Logout

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      req.flash("error", "Logout failed. Please try again.");
      return res.redirect("/");
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        req.flash("error", "Error clearing session. Please try again.");
        return res.redirect("/");
      }

      req.flash("success", "You have been logged out successfully.");
      res.redirect("/auth/login");
    });
  });
});

module.exports = router;
