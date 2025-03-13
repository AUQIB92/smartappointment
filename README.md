# Smart Appointment System

A healthcare appointment booking system with multiple OTP verification methods including SMS, WhatsApp, and Email.

## Features

- User registration with multiple verification methods:
  - SMS OTP verification
  - WhatsApp OTP verification
  - Email OTP verification
- Beautiful and responsive UI
- Secure authentication with JWT
- Dashboard for patients, doctors, and admins

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- WhatsApp Business API access (for WhatsApp OTP)
- SMTP server access (for Email OTP)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartappointment.git
   cd smartappointment
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file based on the `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Update the `.env.local` file with your credentials:
   - JWT secret
   - WhatsApp API credentials
   - Email SMTP credentials

### WhatsApp API Setup

To use the WhatsApp OTP functionality, you need to:

1. Create a Meta Developer account at [developers.facebook.com](https://developers.facebook.com/)
2. Set up a WhatsApp Business API account
3. Create a WhatsApp message template for OTP verification with the following variables:
   - `{{1}}`: User's name
   - `{{2}}`: OTP code
4. Update the `.env.local` file with your WhatsApp API credentials:
   ```
   WHATSAPP_API_URL=https://graph.facebook.com/v17.0
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
   WHATSAPP_TEMPLATE_NAME=otp_verification
   ```

### Email Setup

To use the Email OTP functionality, you need to:

1. Set up an SMTP server or use a service like Gmail
2. If using Gmail, create an App Password (don't use your regular password)
3. Update the `.env.local` file with your email credentials:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@healthcare.com
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## OTP Verification Flow

### SMS OTP
1. User enters their phone number
2. System sends an OTP via SMS
3. User enters the OTP to verify their identity

### WhatsApp OTP
1. User enters their WhatsApp number (with country code)
2. System sends an OTP via WhatsApp
3. User enters the OTP to verify their identity

### Email OTP
1. User enters their email address
2. System sends an OTP via email
3. User enters the OTP to verify their identity

## Development Notes

### WhatsApp API Integration
The WhatsApp API integration is handled in `lib/whatsappApi.js`. This file contains functions for:
- Sending OTP via WhatsApp
- Verifying OTP
- Sending registration confirmation messages

### Email Integration
The email integration is handled in `lib/emailService.js`. This file contains functions for:
- Sending OTP via email
- Verifying OTP
- Sending welcome emails

### API Routes
- `/api/auth/whatsapp-otp`: Sends OTP via WhatsApp
- `/api/auth/verify-whatsapp`: Verifies WhatsApp OTP
- `/api/auth/email-otp`: Sends OTP via email
- `/api/auth/verify-email`: Verifies email OTP
- `/api/auth/register`: Handles SMS OTP (legacy)
- `/api/auth/verify`: Verifies SMS OTP (legacy)

## Security Considerations

- OTPs should expire after a short time (e.g., 10 minutes)
- Store OTPs securely in your database
- Use HTTPS for all API requests
- Implement rate limiting to prevent abuse
- Validate all user inputs
