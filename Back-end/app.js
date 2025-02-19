const express = require("express");
const path = require("path");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/aarogyam", (req, res) => {
  res.render("dashboard");
});

app.get("/admin/dashboard", (req, res) => {
  res.render("admin/dashboard");
});

app.get("/login", (req, res) => {
  res.render("auth/login");
});

app.get("/signup", (req, res) => {
  res.render("auth/signup");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.get('/admin/dashboard', async (req, res) => {
  const appointments = await getAppointments(); // Fetch from DB
  const doctors = await getDoctorsStatus(); // Fetch from DB
  const operations = await getOperations(); // Fetch from DB
  res.render('admin/dashboard', { appointments, doctors, operations });
});
