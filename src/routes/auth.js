const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const authController = require("../controllers/auth");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Auth routes
router
  .route("/login")
  .get(authController.logInFormRender)
  .post(authController.loggedIn);

router
  .route("/signup")
  .get(authController.signUpPageRender);

router
  .route("/signup/doctor")
  .get(authController.doctorSignUpPageRender)
  .post(upload.single("profile"), authController.doctorSignedUp);

router
  .route("/signup/patient")
  .get(authController.patientSignUpPageRender)
  .post(authController.patientSignedUp);

router.get("/logout", authController.loggedOut);

module.exports = router;
