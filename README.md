# Aarogyam – Healthcare Management System (HMS)

A digital platform designed to securely manage student healthcare records, streamline documentation, and improve accessibility within educational institutes.

## Live Demo

[View Aarogyam](https://aarogyam-v6ig.onrender.com/)
[View Demo Video on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7370769756301221888/)

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
- **Health Record Storage** – Store & retrieve medical records, prescriptions & billings.
- **Automated Leave Documentation** – System generates medical certificates and leave requests.
- **Appointment Booking System** – Initial setup for scheduling doctor appointments.
- **Mental Health Chatbot** – Integrated mental health assessment using the Together API.
- **Razorpay Integration** – Payment gateway integrated (currently in test mode).
- **Basic UI/UX** – Web & mobile interfaces designed using ejs.

## Screenshots:

<img width="1900" height="972" alt="image" src="https://github.com/user-attachments/assets/2b921d37-4df7-4006-86c9-7a3a60e38ea7" />
<img width="1919" height="970" alt="image" src="https://github.com/user-attachments/assets/92e2ddcf-6e2f-4da5-808f-268a843abdc6" />
<img width="1919" height="967" alt="image" src="https://github.com/user-attachments/assets/3db5bf96-ca81-4918-be82-4ff8e503d6f7" />
<img width="1919" height="972" alt="image" src="https://github.com/user-attachments/assets/4869e483-2c44-4cd5-80d2-f3983b4b47ba" />
<img width="1919" height="971" alt="image" src="https://github.com/user-attachments/assets/2993ced8-570e-49f1-96ba-8216e1d51621" />
<img width="1919" height="971" alt="image" src="https://github.com/user-attachments/assets/ba1cae42-cfdd-4da9-8db4-539d765f2cf1" />

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
