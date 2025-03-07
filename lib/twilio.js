// lib/twilio.js

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

// Mock Twilio functions for development
const mockTwilio = {
  generateOTP: () => {
    // Generate a random 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  sendOTP: async (mobile, otp) => {
    // In development, just log the OTP instead of sending it
    console.log(`[MOCK SMS] Sending OTP ${otp} to ${mobile}`);
    return { success: true, message: "OTP sent successfully (mock)" };
  },
};

// Real Twilio implementation for production
const realTwilio = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  // Only initialize Twilio if credentials are properly set
  let twilioClient = null;

  if (accountSid && authToken && accountSid.startsWith("AC")) {
    const twilio = require("twilio");
    twilioClient = twilio(accountSid, authToken);
  } else {
    console.warn(
      "Invalid Twilio credentials. SMS functionality will not work."
    );
  }

  return {
    generateOTP: () => {
      // Generate a random 6-digit OTP
      return Math.floor(100000 + Math.random() * 900000).toString();
    },
    sendOTP: async (mobile, otp) => {
      try {
        if (!twilioClient) {
          throw new Error("Twilio client not initialized");
        }

        // Send SMS via Twilio
        await twilioClient.messages.create({
          body: `Your Dr. Imran's Healthcare verification code is: ${otp}`,
          from: twilioPhone,
          to: mobile,
        });

        return { success: true, message: "OTP sent successfully" };
      } catch (error) {
        console.error("Twilio error:", error);
        return { success: false, message: error.message };
      }
    },
  };
};

// Export the appropriate implementation based on environment
const twilioService = isDev ? mockTwilio : realTwilio();

export const generateOTP = twilioService.generateOTP;
export const sendOTP = twilioService.sendOTP;
