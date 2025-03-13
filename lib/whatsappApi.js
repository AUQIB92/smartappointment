/**
 * WhatsApp API Integration for OTP delivery
 * This file contains functions to interact with WhatsApp Business API
 */

import { generateOTP } from './utils';

// WhatsApp API configuration
const WHATSAPP_API_CONFIG = {
  baseUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'otp_verification',
};

/**
 * Send OTP via WhatsApp
 * @param {string} mobile - The recipient's mobile number with country code
 * @param {string} userName - The user's name
 * @param {string} otp - The OTP to send (if not provided, a new one will be generated)
 * @returns {Promise<{success: boolean, otp?: string, error?: string}>}
 */
export async function sendWhatsAppOTP(mobile, userName, otp = null) {
  try {
    // Generate OTP if not provided
    const otpCode = otp || generateOTP(6);
    
    // For demo purposes, we'll just log the OTP instead of making an actual API call
    console.log(`[MOCK] WhatsApp OTP for ${mobile}: ${otpCode}`);
    console.log(`[MOCK] Message: Hello ${userName}, your OTP for verification is: ${otpCode}`);
    
    // In a real implementation, you would make an API call to WhatsApp Business API
    // Uncomment the following code when you have valid API credentials
    
    /*
    // Validate mobile number format
    if (!mobile.startsWith('+')) {
      mobile = '+' + mobile;
    }
    
    // Prepare the WhatsApp message payload
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: mobile,
      type: 'template',
      template: {
        name: WHATSAPP_API_CONFIG.templateName,
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: userName,
              },
              {
                type: 'text',
                text: otpCode,
              },
            ],
          },
        ],
      },
    };

    // Make the API request to WhatsApp
    const response = await fetch(
      `${WHATSAPP_API_CONFIG.baseUrl}/${WHATSAPP_API_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_API_CONFIG.accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('WhatsApp OTP sent successfully:', data);
      return { success: true, otp: otpCode };
    } else {
      console.error('WhatsApp API error:', data);
      return { 
        success: false, 
        error: data.error?.message || 'Failed to send WhatsApp message' 
      };
    }
    */
    
    // For demo purposes, always return success
    return { success: true, otp: otpCode };
  } catch (error) {
    console.error('WhatsApp API exception:', error);
    return { 
      success: false, 
      error: 'An error occurred while sending WhatsApp message' 
    };
  }
}

/**
 * Verify OTP sent via WhatsApp
 * @param {string} mobile - The user's mobile number
 * @param {string} userOtp - The OTP entered by the user
 * @param {string} storedOtp - The OTP stored in the database/session
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function verifyWhatsAppOTP(mobile, userOtp, storedOtp) {
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
 * Send a confirmation message after successful registration
 * @param {string} mobile - The recipient's mobile number with country code
 * @param {string} userName - The user's name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendRegistrationConfirmation(mobile, userName) {
  try {
    // For demo purposes, we'll just log the message instead of making an actual API call
    console.log(`[MOCK] WhatsApp confirmation for ${mobile}`);
    console.log(`[MOCK] Message: Hello ${userName}, your registration is complete. Welcome to our healthcare service!`);
    
    // In a real implementation, you would make an API call to WhatsApp Business API
    // Uncomment the following code when you have valid API credentials
    
    /*
    // Validate mobile number format
    if (!mobile.startsWith('+')) {
      mobile = '+' + mobile;
    }
    
    // Prepare the WhatsApp message payload
    const payload = {
      messaging_product: 'whatsapp',
      to: mobile,
      type: 'template',
      template: {
        name: 'registration_success',
        language: {
          code: 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: userName,
              },
            ],
          },
        ],
      },
    };

    // Make the API request to WhatsApp
    const response = await fetch(
      `${WHATSAPP_API_CONFIG.baseUrl}/${WHATSAPP_API_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_API_CONFIG.accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true };
    } else {
      console.error('WhatsApp API error:', data);
      return { 
        success: false, 
        error: data.error?.message || 'Failed to send confirmation message' 
      };
    }
    */
    
    // For demo purposes, always return success
    return { success: true };
  } catch (error) {
    console.error('WhatsApp API exception:', error);
    return { 
      success: false, 
      error: 'An error occurred while sending confirmation message' 
    };
  }
} 