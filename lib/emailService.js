/**
 * Email Service for OTP delivery and notifications
 * This file contains functions to send emails using Nodemailer
 */

import nodemailer from 'nodemailer';
import { generateOTP } from './utils';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_FROM || 'noreply@healthcare.com',
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: EMAIL_CONFIG.auth,
  });
};

/**
 * Send OTP via Email
 * @param {string} email - The recipient's email address
 * @param {string} userName - The user's name
 * @param {string} otp - The OTP to send (if not provided, a new one will be generated)
 * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
 */
export async function sendEmailOTP(email, userName, otp = null) {
  try {
    // Generate OTP if not provided
    const otpCode = otp || generateOTP(6);
    
    // Log for debugging
    console.log(`Sending OTP email to ${email}: ${otpCode}`);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Healthcare Center" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #0d9488; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Healthcare Center</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            <p style="font-size: 16px;">Thank you for registering with our Healthcare Center. To complete your registration, please use the following verification code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h2 style="font-size: 28px; letter-spacing: 5px; margin: 0; color: #0d9488;">${otpCode}</h2>
            </div>
            <p style="font-size: 16px;">This code will expire in 10 minutes.</p>
            <p style="font-size: 16px;">If you didn't request this code, please ignore this email.</p>
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>Healthcare Center Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, otp: otpCode };
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // For development, return success even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Returning success despite email failure');
        return { success: true, otp: otpCode };
      }
      
      throw emailError;
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: 'Failed to send email. Please try again.' 
    };
  }
}

/**
 * Verify OTP sent via Email
 * @param {string} email - The user's email
 * @param {string} userOtp - The OTP entered by the user
 * @param {string} storedOtp - The OTP stored in the database/session
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function verifyEmailOTP(email, userOtp, storedOtp) {
  try {
    // Simple verification - compare the OTPs
    if (userOtp === storedOtp) {
      return { success: true };
    }
    
    return { 
      success: false, 
      error: 'Invalid OTP. Please try again.' 
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { 
      success: false, 
      error: 'An error occurred during verification' 
    };
  }
}

/**
 * Send a welcome email after successful registration
 * @param {string} email - The recipient's email address
 * @param {string} userName - The user's name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendWelcomeEmail(email, userName) {
  try {
    // Log for debugging
    console.log(`Sending welcome email to ${email}`);
    
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Healthcare Center" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: 'Welcome to Healthcare Center',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #0d9488; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Healthcare Center</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            <p style="font-size: 16px;">Welcome to Healthcare Center! Your account has been successfully created.</p>
            <p style="font-size: 16px;">You can now log in to your account and start booking appointments with our healthcare professionals.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
            </div>
            <p style="font-size: 16px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>Healthcare Center Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true };
    } catch (emailError) {
      console.error('Welcome email sending failed:', emailError);
      
      // For development, return success even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Returning success despite email failure');
        return { success: true };
      }
      
      throw emailError;
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: 'Failed to send welcome email' 
    };
  }
}

/**
 * Send a booking confirmation email
 * @param {string} email - The recipient's email address
 * @param {string} userName - The user's name
 * @param {object} bookingDetails - The booking details
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendBookingConfirmationEmail(email, userName, bookingDetails) {
  try {
    // Log for debugging
    console.log(`Sending booking confirmation email to ${email}`);
    
    const {
      appointmentId,
      doctorName,
      serviceName,
      date,
      time,
      amount,
      paymentMethod,
      notes
    } = bookingDetails;
    
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Healthcare Center" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: 'Your Appointment Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #0d9488; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Healthcare Center</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Hello ${userName},</p>
            <p style="font-size: 16px;">Your appointment has been successfully booked. Here are the details:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0d9488;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Appointment ID:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${appointmentId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Doctor:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${doctorName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Service:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${serviceName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Amount:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">₹${amount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: bold;">Payment Method:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${paymentMethod.toUpperCase()}</td>
                </tr>
                ${notes ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Notes:</td>
                  <td style="padding: 8px 0;">${notes}</td>
                </tr>` : ''}
              </table>
            </div>
            
            <p style="font-size: 16px;">Please arrive 15 minutes before your scheduled appointment time. If you need to reschedule or cancel, please do so at least 24 hours in advance.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/patient/appointments" style="background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Appointments</a>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">Best regards,<br>Healthcare Center Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      `,
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Booking confirmation email sent:', info.messageId);
      return { success: true };
    } catch (emailError) {
      console.error('Booking confirmation email sending failed:', emailError);
      
      // For development, return success even if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Returning success despite email failure');
        return { success: true };
      }
      
      throw emailError;
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: 'Failed to send booking confirmation email' 
    };
  }
} 