const passport = require("passport");

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const ExpressError = require("../utils/expressError");
const { patientSchema, doctorSchema } = require("../validators");

// Render the login form.
module.exports.logInFormRender = (req, res) => {
  res.render("auth/login/login");
};

// Render the main signup page.
module.exports.signUpPageRender = (req, res) => {
  res.render("auth/signup/signup");
};

// Render the doctor signup page.
module.exports.doctorSignUpPageRender = (req, res) => {
  res.render("auth/signup/doctor");
};

// Render the patient signup page.
module.exports.patientSignUpPageRender = (req, res) => {
  res.render("auth/signup/patient");
};

// Handle login for both doctors and patients.
module.exports.loggedIn = async (req, res, next) => {
  try {
    const { username } = req.body;
    // Check if the user exists as a Doctor
    const doctor = await Doctor.findOne({ username });
    if (doctor) {
      passport.authenticate("doctor-local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          req.flash("danger", "Invalid username or password.");
          return res.redirect("/auth/login");
        }
        req.login(user, (err) => {
          if (err) return next(err);
          req.flash("success", "Welcome back to Aarogyam!");
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
          return res.redirect("/auth/login");
        }
        req.login(user, (err) => {
          if (err) return next(err);
          req.flash("success", "Welcome back to Aarogyam!");
          return res.redirect("/patient/dashboard");
        });
      })(req, res, next);
      return;
    }

    // If neither doctor nor patient found
    req.flash("danger", "Invalid username or password.");
    return res.redirect("/auth/login");
  } catch (error) {
    console.error("Error during login:", error);
    req.flash("danger", "Something went wrong. Please try again.");
    return res.redirect("/auth/login");
  }
};

// Handle doctor signup.
module.exports.doctorSignedUp = async (req, res, next) => {
  try {
    // Validate using Joi
    const { error, value } = doctorSchema.validate(req.body);
    if (error) {
      const messages = error.details.map(err => err.message).join(', ');
      console.error("Doctor Validation Error:", messages);
      return next(new ExpressError(400, messages));
    }

    // Extract doctor details; note that the form data is nested under doctor
    const { email, username, password } = req.body.doctor;
    // Create new Doctor instance and store image path if provided
    const newDoctor = new Doctor({
      email,
      username
    });

    // Register doctor with hashed password
    await Doctor.register(newDoctor, password);

    // Auto-login after signup
    req.login(newDoctor, async (err) => {
      if (err) {
        req.flash("error", "Something went wrong during login. Please try again.");
        return next(err);
      }
      // Verify doctor is in DB after login
      const doctor = await Doctor.findById(req.user._id);
      if (!doctor) {
        req.flash("error", "Doctor not found. Please sign up again.");
        return res.redirect("/auth/signup/doctor");
      }
      req.flash("success", "Welcome to Aarogyam, Doctor!");
      return res.redirect("/doctor/dashboard");
    });
  } catch (err) {
    console.error("Error during doctor signup:", err);
    req.flash("error", "Signup failed. Please check your details and try again.");
    return res.redirect("/auth/signup/doctor");
  }
};

// Handle patient signup.
module.exports.patientSignedUp = async (req, res, next) => {
  try {
    // Validate using Joi
    const { error, value } = patientSchema.validate(req.body);
    if (error) {
      const messages = error.details.map(err => err.message).join(', ');
      console.error("Patient Validation Error:", messages);
      return next(new ExpressError(400, messages));
    }

    const { username, email, password } = req.body.patient;
    // Create new Patient instance
    const newPatient = new Patient({ username, email });

    // Register patient with hashed password
    const registeredPatient = await Patient.register(newPatient, password);

    // Auto-login after signup
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
    return res.redirect("/auth/signup/patient");
  }
};

// Handle logout.
module.exports.loggedOut = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      req.flash("error", "Logout failed. Please try again.");
      return res.redirect("back");
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        req.flash("error", "Error clearing session. Please try again.");
        return res.redirect("back");
      }

      // Remove cookie from browser as well
      res.clearCookie("connect.sid");

      return res.redirect("/auth/login");
    });
  });
};
