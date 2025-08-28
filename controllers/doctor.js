const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const Doctor = require("../models/doctor");
const Patient = require("../models/patient");
const Appointment = require("../models/appointment");
const HealthRecord = require("../models/healthrecord");
const Billing = require("../models/billing");
const ExpressError = require("../utils/ExpressError");

// Render Doctor Dashboard
module.exports.dashboard = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user._id);
    if (!doctor) {
      req.flash("error", "Doctor not found.");
      return res.redirect("/auth/login");
    }
    res.render("doctor/dashboard", { doctor });
  } catch (err) {
    console.error("Error fetching doctor data:", err);
    req.flash("error", "Internal Server Error.");
    res.redirect("/auth/login");
  }
};

// List all Appointments
module.exports.appointments = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const appointments = await Appointment.find({ doctorId }).populate("patientId");
    res.render("doctor/appointments", { appointments });
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    req.flash("error", "Failed to load appointments. Please try again.");
    res.redirect("/doctor/dashboard");
  }
};

// // Render Add Appointment Details Page
// module.exports.renderAddAppointmentDetails = async (req, res, next) => {
//   try {
//     const appointmentId = req.params.id;
//     const appointment = await Appointment.findById(appointmentId).populate("patientId").populate("doctorId");
//     if (!appointment) {
//       req.flash("error", "Appointment not found.");
//       return res.redirect("/doctor/appointments");
//     }
//     res.render("doctor/addAppointment", { appointment });
//   } catch (err) {
//     console.error("Error fetching appointment:", err);
//     req.flash("error", "Failed to load appointment details. Please try again.");
//     res.redirect("/doctor/appointments");
//   }
// };

// Render Edit Appointment Page
module.exports.renderEditAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId).populate("patientId").populate("doctorId").populate("healthrecord").populate("billing");
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect("/doctor/appointments");
    }
    res.render("doctor/editAppointment", { appointment});
  } catch (err) {
    console.error("Error fetching data for edit:", err);
    req.flash("error", "Failed to load appointment details. Please try again.");
    res.redirect("/doctor/appointments");
  }
};

// List Patients for the Doctor
module.exports.patients = async (req, res, next) => {
  try {
    const doctorId = req.user._id;
    const doctor = await Doctor.findById(doctorId).populate("patients");
    if (!doctor) {
      req.flash("error", "Doctor not found.");
      return res.redirect("/doctor/dashboard");
    }
    res.render("doctor/patients", { doctor });
  } catch (err) {
    console.error("Error fetching patients:", err);
    req.flash("error", "Failed to load patients. Please try again.");
    res.redirect("/doctor/dashboard");
  }
};

// Display Health Records + Appointments between a Doctor and Patient
module.exports.healthRecords = async (req, res, next) => {
  try {
    const { doctorId, patientId } = req.params;

    // Get all appointments for this doctor-patient pair
    const appointments = await Appointment.find({ doctorId, patientId })
      .populate("patientId"); // optional: populate doctor & patient

    // Collect all healthrecord IDs from appointments
    const healthRecordIds = appointments
      .map(app => app.healthrecord) // since it's a single ObjectId
      .filter(id => id); // remove null/undefined

    // Fetch the healthrecords
    const healthrecords = await HealthRecord.find({ _id: { $in: healthRecordIds } });

    // Pass both appointments + healthrecords to view
    res.render("doctor/healthrecords", { appointments, healthrecords });
  } catch (error) {
    console.error("Error fetching health records:", error);
    req.flash("error", "Failed to load health records. Please try again.");
    res.redirect("/doctor/patients");
  }
};

// Render Prescriptions between a Doctor and a Patient
module.exports.prescriptions = async (req, res, next) => {
  try {
    const { doctorId, patientId } = req.params;

    // Fetch all appointments between doctor & patient
    const appointments = await Appointment.find({ doctorId, patientId })
      .populate("patientId"); // optional populate for details

    // Pass to EJS
    res.render("doctor/prescriptions", { appointments });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    req.flash("error", "Failed to load prescriptions. Please try again.");
    res.redirect("/doctor/patients");
  }
};

// Generate a Medical Certificate PDF for a Patient
module.exports.generateCertificate = async (req, res, next) => {
  try {
    const { admissionDate, dischargeDate } = req.body;
    const patient = await Patient.findById(req.params.patientId).populate("doctors");
    if (!patient) {
      req.flash("error", "Patient not found.");
      return res.redirect("/doctor/dashboard");
    }
    const fileName = `medical_certificate_${patient._id}.pdf`;
    const certificatesDir = path.join(__dirname, "../public/certificates");
    const filePath = path.join(certificatesDir, fileName);

    // Ensure that the certificates directory exists
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    // Create the PDF document
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add content to the certificate
    doc.fontSize(20).text("Medical Leave Certificate", { align: "center" }).moveDown();
    doc.fontSize(12).text(`Patient Name: ${patient.username}`);
    doc.text(`Email: ${patient.email}`);
    doc.text(`Gender: ${patient.gender}`);
    doc.text(`Age: ${patient.age}`);
    doc.text(`Blood Type: ${patient.bloodType}`);
    doc.text(`Doctor: ${patient.doctors[0]?.name || "N/A"}`);
    doc.text(`Admission Date: ${admissionDate}`);
    doc.text(`Discharge Date: ${dischargeDate}`);
    doc.moveDown();
    doc.text(`This is to certify that ${patient.username} was admitted from ${admissionDate} to ${dischargeDate} and requires medical leave.`);
    doc.moveDown();
    doc.text("_________________________");
    doc.text("Doctor's Signature");
    doc.end();

    stream.on("finish", () => {
      const fileUrl = `/certificates/${fileName}`;
      res.status(200).json({ fileUrl });
    });

    stream.on("error", (err) => {
      console.error("Error generating certificate:", err);
      req.flash("error", "Error generating certificate. Please try again.");
      res.redirect(`/doctor/patients/${patient._id}`);
    });
  } catch (error) {
    console.error("Server error:", error);
    req.flash("error", "Internal server error.");
    res.redirect("/doctor/patients");
  }
};

// // Add Appointment Details (POST)
// module.exports.addAppointmentDetails = async (req, res, next) => {
//   try {
//     const appointmentId = req.params.id;
//     const { symptoms, disease, billAmount } = req.body.patient;

//     console.log(symptoms, disease, billAmount);

//     // Find the appointment by id
//     const appointment = await Appointment.findById(appointmentId);
//     if (!appointment) {
//       req.flash("error", "Appointment not found.");
//       return res.redirect("/doctor/appointments");
//     }

//     // Extract the uploaded file paths
//     const prescriptionUrl = req.files["patient[prescription]"]?.[0]?.path || null;
//     const medicalReports = req.files["patient[medicalReports]"]?.[0]?.path || null;
//     const billUrl = req.files["patient[bill]"]?.[0]?.path || null;

//     // Update appointment details
//     appointment.disease = disease;
//     appointment.symptoms = symptoms;
//     appointment.status = "completed";
//     if (prescriptionUrl) {
//       appointment.attachments.push(prescriptionUrl);
//     }

//     // Update HealthRecord attachments if exists, otherwise create new
//     let healthRecord = await HealthRecord.findOne({
//       patientId: appointment.patientId,
//       doctorId: appointment.doctorId
//     });

//     if (healthRecord) {
//       // Push new attachments into the existing array
//       if (medicalReports) {
//         healthRecord.attachments.push(medicalReports);
//         await healthRecord.save();
//       }
//     } else {
//       // Create new record if not exists
//       healthRecord = new HealthRecord({
//         patientId: appointment.patientId,
//         doctorId: appointment.doctorId,
//         disease,
//         symptoms,
//         attachments: medicalReports,
//       });
//       await healthRecord.save();
//       appointment.healthrecord = healthRecord._id;
//     }

//     // Create a new billing record
//     if(billUrl) {
//       const invoiceNo = `INV-${Math.floor(Math.random() * 9000) + 1000}`;
//       const billing = new Billing({
//         patientId: appointment.patientId,
//         doctorId: appointment.doctorId,
//         invoiceNo,
//         date: new Date(),
//         amount: billAmount, // Update this later as needed
//         reason: disease,
//         status: "pending",
//         paymentMethod: "UPI",
//         attachments: billUrl ? [billUrl] : [],
//       });
//       await billing.save();
//       appointment.billing = billing._id;
//     }
//     await appointment.save();

//     req.flash("success", "Appointment details added successfully.");
//     res.redirect("/doctor/appointments");
//   } catch (err) {
//     console.error("Error updating records:", err);
//     req.flash("error", "An error occurred while updating appointment details.");
//     res.redirect("/doctor/appointments");
//   }
// };

// Edit Appointment Details (POST)
module.exports.editAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const { symptoms, disease, amount } = req.body.patient;

    // Validate mandatory fields
    if (!disease || !symptoms) {
      req.flash("error", "Disease and symptoms are required.");
      return res.redirect("back");
    }

    // Extract uploaded files paths
    const prescriptionUrl = req.files?.["patient[prescription]"]?.[0]?.path || null;
    const medicalReports = req.files?.["patient[medicalReports]"]?.map(file => file.path) || [];
    const billUrl = req.files?.["patient[bill]"]?.[0]?.path || null;

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect("/doctor/appointments");
    }

    // Update core fields
    appointment.disease = disease;
    appointment.symptoms = symptoms;
    appointment.status = "completed";

    // Append prescription if uploaded
    if (prescriptionUrl) {
      appointment.attachments.push(prescriptionUrl);
    }
    await appointment.save();

    // Update / append to health record
    const healthRecord = await HealthRecord.findById(appointment.healthrecord);
    if (healthRecord) {
      healthRecord.disease = disease;
      healthRecord.symptoms = symptoms;
      if (medicalReports.length > 0) {
        healthRecord.attachments.push(...medicalReports);
      }
      await healthRecord.save();
    } else {
      // Create new health record if not exists
      if (medicalReports.length > 0) {
        const newHealthRecord = new HealthRecord({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          disease,
          symptoms,
          attachments: medicalReports,
        });
        await newHealthRecord.save();
        appointment.healthrecord = newHealthRecord._id;
        await appointment.save();
      }
    }

    // Update / append to billing
    const billing = await Billing.findById(appointment.billing);
    if (billing) {
      billing.reason = disease;
      billing.amount = amount;
      if (billUrl) {
        billing.attachments.push(billUrl);
      }
      await billing.save();
    } else {
      // Create new billing if not exists
      if (billUrl) {
        const invoiceNo = `INV-${Math.floor(Math.random() * 9000) + 1000}`;
        const newBilling = new Billing({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          invoiceNo,
          date: new Date(),
          amount: amount,
          reason: disease,
          status: "pending",
          paymentMethod: "UPI",
          attachments: [billUrl],
        });
        await newBilling.save();
        appointment.billing = newBilling._id;
        await appointment.save();
      }
    }

    req.flash("success", "Appointment details updated successfully.");
    res.redirect("/doctor/appointments");

  } catch (err) {
    console.error("Error updating records:", err);
    req.flash("error", "Internal Server Error while updating appointment.");
    res.redirect("/doctor/appointments");
  }
};

// Confirm an Appointment (POST)
module.exports.confirmAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      req.flash("error", "Appointment not found.");
      return res.redirect("/doctor/appointments");
    }

    // Update appointment status
    appointment.status = "confirmed";
    await appointment.save();

    // Add the patient to the doctor's list (avoiding duplicates)
    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      $addToSet: { patients: appointment.patientId }
    });

    // Add the doctor to the patient's list (avoiding duplicates)
    await Patient.findByIdAndUpdate(appointment.patientId, {
      $addToSet: { doctors: appointment.doctorId }
    });

    req.flash("success", "Appointment confirmed successfully.");
    res.redirect("/doctor/appointments");
  } catch (err) {
    console.error("Error confirming appointment:", err);
    req.flash("error", "Internal Server Error while confirming appointment.");
    res.redirect("/doctor/appointments");
  }
};
