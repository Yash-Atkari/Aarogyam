const Joi = require('joi');

module.exports.appointmentSchema = Joi.object({
    patient: Joi.object({
      doctorId: Joi.string().required(), // could validate as an ObjectId if needed
      appointmentDate: Joi.date().greater('now').required().messages({
        'date.greater': 'Appointment date must be in the future.'
      }),
      timeSlot: Joi.string().valid(
        '09:00-09:30',
        '09:30-10:00',
        '10:00-10:30',
        '10:30-11:00'
      ).required(),
      reason: Joi.string().allow('').max(500) // optional
    }).required()
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
  