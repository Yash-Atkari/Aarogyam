const Joi = require('joi');

module.exports.appointmentSchema = Joi.object({
  patient: Joi.object({
    doctorId: Joi.string().required(),

    appointmentDate: Joi.date()
      .required()
      .custom((value, helpers) => {
        const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
        const todayIST = nowIST.toISOString().split("T")[0];
        const valueIST = new Date(value.getTime() + 5.5 * 60 * 60 * 1000);
        const selectedDate = valueIST.toISOString().split("T")[0];

        if (selectedDate < todayIST) {
          return helpers.error("date.greater");
        }
        return value;
      })
      .messages({
        "date.greater": "Appointment date must be today or in the future (IST).",
      }),

    timeSlot: Joi.string()
      .pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
      .required()
      .custom((value, helpers) => {
        const [startTime, endTime] = value.split("-");
        if (!startTime || !endTime) {
          return helpers.error("any.invalid", { message: "Invalid time slot format" });
        }

        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        if ([sh, sm, eh, em].some(Number.isNaN)) {
          return helpers.error("any.invalid", { message: "Invalid time numbers" });
        }

        // ensure end > start
        if (eh < sh || (eh === sh && em <= sm)) {
          return helpers.error("time.order");
        }

        // get appointment date (parent value)
        const parent = helpers.state && helpers.state.ancestors && helpers.state.ancestors[0];
        const appointmentDateRaw = parent && parent.appointmentDate;
        if (!appointmentDateRaw) {
          return helpers.error("any.required", { message: "Appointment date required to validate time slot" });
        }

        // produce date part as YYYY-MM-DD
        const datePart = new Date(appointmentDateRaw).toISOString().split("T")[0];

        // Build a Date representing the slot start in IST by using an ISO string with timezone.
        // Example: "2025-08-29T14:00:00+05:30"
        const slotIso = `${datePart}T${startTime}:00+05:30`;
        const slotDateTime = new Date(slotIso);

        if (Number.isNaN(slotDateTime.getTime())) {
          return helpers.error("date.format", { message: "Invalid appointment date/time" });
        }

        // Compare with NOW (no manual offset). If slot <= now => invalid.
        if (slotDateTime <= new Date()) {
          return helpers.error("time.past");
        }

        return value;
      })
      .messages({
        "time.past": "Appointment slot must be in the future (IST).",
        "time.order": "Time slot end must be after start.",
      }),
      
    reason: Joi.string().allow("").max(500),
  }).required(),
});

  module.exports.patientSchema = Joi.object({
    patient: Joi.object({
      email: Joi.string().email().required().messages({
        'any.required': 'Email is required.'
      }),
      username: Joi.string().min(3).max(30).required().messages({
        'any.required': 'Username is required.'
      }),
      password: Joi.string().min(6).required().messages({
        'any.required': 'Password is required.'
      })
    })
  });  
  
  module.exports.doctorSchema = Joi.object({
    doctor: Joi.object({
      email: Joi.string().email().required().messages({
        'any.required': 'Email is required.'
      }),
      username: Joi.string().min(3).max(30).required().messages({
        'any.required': 'Username is required.'
      }),
      password: Joi.string().min(6).required().messages({
        'any.required': 'Password is required.'
      }),
    })
  });
  