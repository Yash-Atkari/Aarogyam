# Aarogyam – Healthcare Management System (HMS)

A digital platform designed to securely manage student healthcare records, streamline documentation, and improve accessibility within educational institutes.

## Live Demo

[View Aarogyam](https://your-deployment-url.com)

## Tech Stack

- **Frontend:** EJS, Bootstrap
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **Authentication:** Passport, Firebase 
- **Notifications:** None
- **Cloud Storage:** Cloudinary (for medical reports & prescriptions)
- **AI Chatbot:** Together API (Mental Health Assessment)
- **Payment Gateway:** Razorpay (Test Mode)

## Features:
- **User Authentication** – Secure login/signup using passport-based authentication.
- **Student Dashboard** – View medical history, prescriptions, and past treatments.
- **Health Record Storage** – Backend API to store & retrieve medical records.
- **Automated Leave Documentation** – System generates medical certificates and leave requests.
- **Appointment Booking System** – Initial setup for scheduling doctor appointments.
- **Mental Health Chatbot** – Integrated mental health assessment using the Together API.
- **Razorpay Integration** – Payment gateway integrated (currently in test mode).
- **Basic UI/UX** – Web & mobile interfaces designed using ejs.

## Screenshots:

<img width="1901" height="908" alt="image" src="https://github.com/user-attachments/assets/24473bc1-393d-42e5-a49b-cbbb34dc46ba" />

<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/91a5e652-4412-493f-8871-7caff05244f3" />

<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/423b2356-f2fd-42b7-8485-bc06e6c08a47" />

<img width="1919" height="907" alt="image" src="https://github.com/user-attachments/assets/de57c897-dd22-43ff-a962-80ff67e1ab47" />

<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/63bdd586-6999-40bc-b5f9-53c79b1f3840" />

<img width="1919" height="913" alt="image" src="https://github.com/user-attachments/assets/de80ecd9-385d-46d7-8099-3bb53febf5bc" />

<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/4fa3542a-02e2-42cd-8237-cfab6133608d" />


How to Run the Project

1. Clone the Repository

git clone https://github.com/your-repo-link.git
cd healthcare-management-system

2. Install Dependencies
Backend Setup:

cd backend
npm install

Frontend Setup:
cd frontend
npm install

3. Configure Environment Variables
Create a .env file in the backend directory and add:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key

Current Limitations & Next Steps
🔹 Pending Features: Appointment confirmation, advanced filtering, and notifications, document generation.

🔹 Next Focus: Enhancing UI, securing data with encryption, and integrating email/SMS notifications.

This guide ensures the organizers can set up and test the project easily. Let me know if you need any refinements! 🚀
