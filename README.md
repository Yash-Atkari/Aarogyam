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

<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/c1590a0e-8332-4787-bf87-e1d6fe41824d" />

<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/a8da721e-8674-49ec-80f9-c7bcf11a6e59" />

<img width="1919" height="907" alt="image" src="https://github.com/user-attachments/assets/de57c897-dd22-43ff-a962-80ff67e1ab47" />

<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/63bdd586-6999-40bc-b5f9-53c79b1f3840" />

<img width="1919" height="913" alt="image" src="https://github.com/user-attachments/assets/de80ecd9-385d-46d7-8099-3bb53febf5bc" />

<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/4fa3542a-02e2-42cd-8237-cfab6133608d" />

## How to Run the Project

### 1. Clone the Repository

```bash
https://github.com/Yash-Atkari/Aarogyam.git
cd healthcare-management-system
```
### 2. Install dependencies
```bash
npm install
```
### 3. Create a .env file inside the backend folder and add
```bash
PORT=your_port
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
TOGETHER_API_KEY=your_together_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```
### 4. Start the backend server
```bash
npm app.js
```
The backend will run on: `http://localhost:xxxx`

## Contributing

We welcome contributions to improve Aarogyam!

If you'd like to add a feature, fix a bug, or enhance the UI/UX:

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m "Add new feature"`)
4. Push to your branch (`git push origin feature-name`)
5. Create a Pull Request

Please ensure your code follows clean coding practices and includes comments or documentation where necessary.

Feel free to raise issues or suggestions — let's build this better together! 🚀
