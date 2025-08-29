const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError"); // Update path if needed
const Doctor = require("./models/doctor");

module.exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is logged in, proceed to the next middleware
  }

  req.flash("danger", "Please log in to access this page.");
  res.redirect("/auth/login"); // Redirect to login if not authenticated
}

// isOwner middleware for any resource
module.exports.isAuthorized = (Model, paramIdField = 'id', resourceOwnerField = '_id') => {
  return async (req, res, next) => {
    const resourceId = req.params[paramIdField];

    // Check if the ID is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return next(new ExpressError(400, "Invalid resource ID."));
    }

    try {
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return next(new ExpressError(404, "Resource not found."));
      }

      if (!resource[resourceOwnerField].equals(req.user._id)) {
        return next(new ExpressError(403, "You are not authorized to perform this action."));
      }
      
      next();
    } catch (err) {
      console.error(err);
      return next(new ExpressError(500, "An error occurred while checking ownership."));
    }
  };
};

module.exports.isPatientOfDoctor = async (req, res, next) => {
  const patientId = req.params.id;

  // Validate the patientId is a proper ObjectId
  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return next(new ExpressError(400, "Invalid patient ID."));
  }
  
  try {
    // Fetch the logged-in doctor and populate their patients array
    const doctor = await Doctor.findById(req.user._id).populate("patients");

    if (!doctor) {
      return next(new ExpressError(404, "Doctor not found."));
    }

    // Check if the patient exists in the doctor's list
    const isAssociated = doctor.patients.some(patient =>
      patient._id.toString() === patientId.toString()
    );

    if (!isAssociated) {
      return next(new ExpressError(403, "You are not authorized to access this patient."));
    }

    // If the patient is associated with the doctor, continue
    next();
  } catch (err) {
    console.error(err);
    return next(new ExpressError(500, "Server error while verifying patient association."));
  }
};

module.exports.isDoctorOfPatient = (Appointment) => async (req, res, next) => {
  const { doctorId, patientId } = req.params;

  // Check if doctor in session is trying to access their own patient's data
  if (!req.user._id.equals(doctorId)) {
    return next(new ExpressError("Unauthorized access.", 403));
  }

  const appointment = await Appointment.findOne({ doctorId, patientId });
  if (!appointment) {
    return next(new ExpressError("You are not authorized to view this patient's prescriptions.", 403));
  }

  next();
};

module.exports.isDoctorOfPatientBySession = (AppointmentModel) => {
  return async (req, res, next) => {
    const doctorId = req.user._id.toString();
    const patientId = req.params.patientId;

    try {
      const appointment = await AppointmentModel.findOne({ doctorId, patientId });

      if (!appointment) {
        throw new ExpressError(403, "You are not authorized to access this patient's records.");
      }

      next();
    } catch (err) {
      next(err); // Pass custom or other errors to global error handler
    }
  };
};
