# Dr. Imran's Healthcare and Diagnostic Centre

A modern online appointment booking system for Dr. Imran's Healthcare and Diagnostic Centre.

## Features

- **Mobile OTP-based Authentication**: Secure login and registration using mobile OTP verification.
- **Role-based Access Control**: Different dashboards and permissions for patients, doctors, and administrators.
- **Appointment Management**: Book, view, and manage appointments with ease.
- **Doctor Availability**: Doctors can set their available time slots.
- **Admin Dashboard**: Administrators can add doctors and manage the system.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT, OTP via Twilio
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- Twilio Account (for SMS OTP)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/drimranshealthcare.git
   cd drimranshealthcare
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Run the development server:

   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
drimranshealthcare/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── page.js           # Landing page
├── components/           # Reusable components
├── lib/                  # Utility functions
├── middleware/           # Middleware functions
├── models/               # MongoDB models
├── public/               # Static files
└── styles/               # Global styles
```

## License

This project is licensed under the MIT License.
