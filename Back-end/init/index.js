const Patient = require("../models/patient");
const Doctor = require("../models/doctor");

// Sample patient and doctor data arrays
const patients = [
    {
        username: "john_doe",
        email: "john@example.com",
        gender: "male",
        age: 30,
        height: 175,
        weight: 70,
        bloodType: "O+",
        healthRecord: [],
        appointments: [],
        doctors: []
    },
    {
        username: "jane_doe",
        email: "jane@example.com",
        gender: "female",
        age: 28,
        height: 165,
        weight: 60,
        bloodType: "A+",
        healthRecord: [],
        appointments: [],
        doctors: []
    }
];

const doctors = [
    {
        username: "dr_smith",
        email: "smith@example.com",
        specialization: "Cardiologist",
        experience: 15,
        hospital: "City Hospital",
        consultantFees: 500,
        phone: "1234567890",
        profile: "https://example.com/profile1.jpg"
    },
    {
        username: "dr_jones",
        email: "jones@example.com",
        specialization: "Dermatologist",
        experience: 10,
        hospital: "Skin Care Center",
        consultantFees: 400,
        phone: "0987654321",
        profile: "https://example.com/profile2.jpg"
    }
];

// Insert data into MongoDB
async function seedDB() {
    await Patient.insertMany(patients);
    console.log("Patients added!");

    await Doctor.insertMany(doctors);
    console.log("Doctors added!");
}

seedDB().catch((err) => console.log(err));
