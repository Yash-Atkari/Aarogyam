const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");


const passport = require("passport");

const { patientSchema, doctorSchema } = require("../schema");

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const ExpressError = require("../utils/ExpressError");

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
      passport.authenticate("doctor-local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("danger", "Invalid username or password.");
          return res.redirect("/auth/login"); // Failed login
        }

        req.login(user, (err) => {
          if (err) return next(err);
          req.flash("success", "Welcome back to Aarogyam!");
          // Redirect using a parameterized route so that the isAuthorized middleware can do its job
          return res.redirect("/doctor/dashboard");
        });
      })(req, res, next);
      return;
    }

    // Check if the user exists as a Patient
    const patient = await Patient.findOne({ username });
    if (patient) {
      passport.authenticate("patient-local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("danger", "Invalid username or password.");
          return res.redirect("/auth/login"); // Failed login
        }

        req.login(user, (err) => {
          if (err) return next(err);
          req.flash("success", "Welcome back to Aarogyam!");
          // Redirect using a parameterized route including the patient ID
          return res.redirect("/patient/dashboard");
        });
      })(req, res, next);
      return;
    }

    // If neither doctor nor patient is found
    req.flash("danger", "Invalid username or password.");
    return res.redirect("/auth/login");
  } catch (error) {
    console.error("Error during login:", error);
    req.flash("danger", "Something went wrong. Please try again.");
    return res.redirect("/auth/login");
  }
});

// Doctor signup route

router.post("/signup/doctor", upload.single("profile"), async (req, res, next) => {
  try {
    // Validate data using Joi
    const { error, value } = doctorSchema.validate(req.body);

    if (error) {
      const messages = error.details.map(err => err.message).join(', ');
      console.error("Doctor Validation Error:", messages);
      return next(new ExpressError(400, messages)); // Add `return` to prevent further execution
    }

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
    const { error, value } = patientSchema.validate(req.body);

    if (error) {
      const messages = error.details.map(err => err.message).join(', ');
      console.error("Patient Validation Error:", messages);
      return next(new ExpressError(400, messages));
    }

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
      return res.redirect("back"); // Stay on same page
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        req.flash("error", "Error clearing session. Please try again.");
        return res.redirect("back"); // Stay on same page
      }

      return res.redirect("/auth/login"); // Successful logout
    });
  });
});

module.exports = router;
