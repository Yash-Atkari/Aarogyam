if(process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const RazorPay = require("razorpay");
const crypto = require('crypto');
const razorpay = new RazorPay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET
});

const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const engine = require('ejs-mate');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const methodOverride = require("method-override");
const multer = require("multer");
const bodyParser = require("body-parser");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ExpressError = require("./utils/ExpressError");

const app = express();

// Serve certificates statically
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.engine('ejs', engine);
app.use(methodOverride("_method"));
app.use('/uploads', express.static('uploads'));

// MODELS

const Doctor = require("./models/doctor");
const Patient = require("./models/patient");
const Billing = require("./models/billing");

// MONGODB CONNECTION

// const MongoUrl = "mongodb://127.0.0.1:27017/aarogyam";
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("Error:", err));

async function main() {
  await mongoose.connect(dbUrl);
}

// async function main() {
//   await mongoose.connect(MongoUrl);
// }

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

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
      secret: "process.env.SECRET",
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE");
});

const sessionOptions = {
  store,
  secret: "process.env.SECRET",
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
  res.locals.danger = req.flash("danger");
  res.locals.currUser = req.user;
  next();
});

async function handleGoogleSignIn(req, res, Model, defaultRole) {
  const { email, username } = req.body;
  try {
    let user = await Model.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new Model({ email, username, role: defaultRole });
      await user.save();
      isNewUser = true;
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('Passport logIn error:', err);
        return res.status(500).json({ success: false });
      }
      return res.json({ success: true, role: user.role, isNewUser });
    });
  } catch (err) {
    console.error(`🔥 Google Auth error (${defaultRole}):`, err);
    return res.status(500).json({ success: false });
  }
}

app.post('/auth/google/patient', (req, res) => {
  handleGoogleSignIn(req, res, Patient, 'patient');
});

app.post('/auth/google/doctor', (req, res) => {
  handleGoogleSignIn(req, res, Doctor, 'doctor');
});

app.post('/auth/google-login', async (req, res) => {
  const { email } = req.body;
  try {
    // Try to find patient by email
    let user = await Patient.findOne({ email });

    if (!user) {
      // If not found in patients, try doctors
      user = await Doctor.findOne({ email });

      if (!user) {
        // No user found at all
        return res.status(404).json({ 
          success: false, 
          message: "No account found with this email 😕"
        });
      }
    }

    // Log the user in using Passport
    req.logIn(user, (err) => {
      if (err) {
        console.error("Log in error", err);
        return res.status(500).json({ 
          success: false, 
          message: 'An error occurred while logging you in. Please try again.' 
        });
      }

      // Successful login
      return res.json({ success: true });
    });
  }
  catch (err) {
    console.error("/auth/google-login error", err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error occurred. Please try again later.' 
    });
  }
});

// HOME PAGE

app.get("/", (req, res) => res.render("dashboard"));

// AUTH ROUTES

const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

// PATIENT ROUTES

const patientRouter = require("./routes/patient");
app.use("/patient", patientRouter);

// DOCTOR ROUTES

const doctorRouter = require("./routes/doctor");
app.use("/doctor", doctorRouter);

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const payload = {
      model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
      messages: [
        {
          role: "system",
          content:
            "You are a kind, empathetic mental health assistant. Respond politely and respectfully even if the user uses rude language.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    };

    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        },
      }
    );

    const botResponse = response.data.choices?.[0]?.message?.content || "Sorry, I couldn't understand that.";

    res.json({ choices: [{ message: { content: botResponse } }] });
  } catch (error) {
    console.error("Together API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch AI response" });
  }
});

// Create an order endpoint
app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;      // amount in INR, e.g. 500 for ₹500
    const options = {
      amount: amount * 100,           // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ success: false, error: 'Order creation failed' });
  }
});

app.post('/verify-payment/:billingId', async (req, res) => {
  // Extracts the details sent by the Razorpay handler on the frontend.
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  // Creates a secure HMAC SHA256 signature using your secret key - This mirrors what Razorpay sends in razorpay_signature.
  const hmac = crypto.createHmac('sha256', process.env.RZP_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const expectedSignature = hmac.digest('hex');

// Compares your generated signature with Razorpay's - If they match: payment is legit.
  if (expectedSignature === razorpay_signature) {
   try {
      const billingId = req.params.billingId;

      // ✅ Replace with your actual Mongoose model
      const billing = await Billing.findById(billingId);
      if (!billing) return res.status(404).json({ success: false, error: 'Billing record not found' });

      billing.status = 'paid';
      await billing.save();

      return res.json({ success: true });
    } catch (err) {
      console.error('Error updating billing status:', err);
      return res.status(500).json({ success: false, error: 'Failed to update billing status' });
    }
  } else {
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }
});

// ERROR HANDLER

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  let { statusCode=500, message="Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { err });
});

// SERVER LISTENING

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}/`);
});
