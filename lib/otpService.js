/**
 * OTP Service for generating, storing, and verifying OTPs
 * This service uses MongoDB to store OTPs
 */

import connectToDatabase from './db';
import { generateOTP } from './utils';
import User from '../models/User';

/**
 * Generate and store OTP for a user
 * @param {string} identifier - User identifier (mobile, email, etc.)
 * @param {string} identifierType - Type of identifier ('sms', 'email', 'whatsapp')
 * @param {boolean} isRegistration - Whether this is for registration or login
 * @param {Object} additionalData - Additional data to store (e.g., email for SMS registration)
 * @returns {Promise<{success: boolean, otp: string, error?: string}>}
 */
export async function generateAndStoreOTP(identifier, identifierType, isRegistration = false, additionalData = {}) {
  try {
    console.log(`OTP Service - Generating OTP for ${identifierType}: ${identifier}`);
    
    // Connect to database
    await connectToDatabase();
    
    // Generate OTP
    const otp = generateOTP(6);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    console.log(`OTP Service - Generated OTP: ${otp}`);
    
    // Determine the query based on identifier type
    let query = {};
    if (identifierType === 'email') {
      query = { email: identifier };
    } else if (identifierType === 'whatsapp' || identifierType === 'sms' || identifierType === 'phone') {
      query = { mobile: identifier };
    } else {
      throw new Error('Invalid identifier type');
    }
    
    // For registration, we'll create a temporary user record
    if (isRegistration) {
      // Check if user already exists
      const existingUser = await User.findOne(query);
      
      if (existingUser) {
        console.log(`OTP Service - Updating existing user with OTP: ${otp}`);
        
        // Update existing user's OTP
        if (existingUser.otp && typeof existingUser.otp === 'object') {
          existingUser.otp.code = otp;
          existingUser.otp.expiresAt = otpExpiry;
        } else {
          // Handle case where otp field might not be an object
          existingUser.otp = {
            code: otp,
            expiresAt: otpExpiry
          };
        }
        
        // Also set the old otpExpiry field for backward compatibility
        existingUser.otpExpiry = otpExpiry;
        
        // Update with additional data if provided
        if (additionalData.email && !existingUser.email) {
          console.log(`OTP Service - Adding email ${additionalData.email} to existing user`);
          existingUser.email = additionalData.email;
        }
        
        await existingUser.save();
      } else {
        console.log(`OTP Service - Creating new temporary user with OTP: ${otp}`);
        
        // Create a temporary user record with minimal information
        const userData = {
          name: 'Temporary User', // Will be updated after verification
          address: 'Temporary Address', // Will be updated after verification
          otpExpiry: otpExpiry,
          verified: false,
          contactMethod: identifierType // Set the contact method based on identifier type
        };
        
        // Add the identifier field
        if (identifierType === 'email') {
          userData.email = identifier;
        } else {
          userData.mobile = identifier;
          
          // If email is provided in additionalData, add it to the user record
          if (additionalData.email) {
            console.log(`OTP Service - Adding email ${additionalData.email} to new user`);
            userData.email = additionalData.email;
          }
        }
        
        // Add OTP data
        userData.otp = {
          code: otp,
          expiresAt: otpExpiry
        };
        
        const newUser = new User(userData);
        await newUser.save();
      }
    } else {
      // For login, update existing user's OTP
      const user = await User.findOne(query);
      
      if (!user) {
        console.log(`OTP Service - User not found for ${identifierType}: ${identifier}`);
        return {
          success: false,
          error: 'User not found'
        };
      }
      
      console.log(`OTP Service - Updating user with login OTP: ${otp}`);
      
      // Update user's OTP
      if (user.otp && typeof user.otp === 'object') {
        user.otp.code = otp;
        user.otp.expiresAt = otpExpiry;
      } else {
        // Handle case where otp field might not be an object
        user.otp = {
          code: otp,
          expiresAt: otpExpiry
        };
      }
      
      // Also set the old otpExpiry field for backward compatibility
      user.otpExpiry = otpExpiry;
      
      await user.save();
    }
    
    console.log(`OTP Service - Successfully stored OTP: ${otp}`);
    
    return {
      success: true,
      otp
    };
  } catch (error) {
    console.error('OTP generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify OTP for a user
 * @param {string} identifier - User identifier (mobile, email, etc.)
 * @param {string} identifierType - Type of identifier ('sms', 'email', 'whatsapp')
 * @param {string} otp - OTP to verify
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function verifyOTP(identifier, identifierType, otp) {
  try {
    console.log(`OTP Service - Verifying OTP: ${otp} for ${identifierType}: ${identifier}`);
    
    // Connect to database
    await connectToDatabase();
    
    // Determine the query based on identifier type
    let query = {};
    if (identifierType === 'email') {
      query = { email: identifier };
    } else if (identifierType === 'whatsapp' || identifierType === 'sms' || identifierType === 'phone') {
      query = { mobile: identifier };
    } else {
      throw new Error('Invalid identifier type');
    }
    
    // Find user by identifier
    const user = await User.findOne(query);
    
    if (!user) {
      console.log(`OTP Service - User not found for ${identifierType}: ${identifier}`);
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    console.log(`OTP Service - Found user: ${user._id}`);
    
    // For development, accept '123456' as a valid OTP
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
      console.log('OTP Service - Using development OTP bypass: 123456');
      
      // Clear OTP after successful verification
      if (user.otp && typeof user.otp === 'object') {
        user.otp.code = null;
        user.otp.expiresAt = null;
      }
      
      await user.save();
      
      return {
        success: true,
        user
      };
    }
    
    // Check if OTP exists
    let storedOtp = null;
    let otpExpiry = null;
    
    // Try to get OTP from the new structure
    if (user.otp && typeof user.otp === 'object' && user.otp.code) {
      storedOtp = user.otp.code;
      otpExpiry = user.otp.expiresAt;
      console.log(`OTP Service - Found OTP in new structure: ${storedOtp}`);
    } 
    // Fallback to old structure
    else if (user.otpExpiry) {
      // In old structure, we don't have a stored OTP, so we'll accept any OTP
      // This is just for backward compatibility
      storedOtp = otp;
      otpExpiry = user.otpExpiry;
      console.log(`OTP Service - Using fallback to old structure with expiry: ${otpExpiry}`);
    }
    
    if (!storedOtp || !otpExpiry) {
      console.log('OTP Service - No OTP found or OTP expired');
      return {
        success: false,
        error: 'No OTP found or OTP expired'
      };
    }
    
    // Check if OTP is expired
    if (new Date() > new Date(otpExpiry)) {
      console.log('OTP Service - OTP expired');
      return {
        success: false,
        error: 'OTP expired'
      };
    }
    
    // Verify OTP
    if (storedOtp !== otp) {
      console.log(`OTP Service - Invalid OTP. Expected: ${storedOtp}, Got: ${otp}`);
      return {
        success: false,
        error: 'Invalid OTP'
      };
    }
    
    console.log('OTP Service - OTP verified successfully');
    
    // Clear OTP after successful verification
    if (user.otp && typeof user.otp === 'object') {
      user.otp.code = null;
      user.otp.expiresAt = null;
    }
    
    // Also clear the old otpExpiry field for backward compatibility
    user.otpExpiry = null;
    
    await user.save();
    
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update user information after successful OTP verification
 * @param {string} identifier - User identifier (mobile, email, etc.)
 * @param {string} identifierType - Type of identifier ('sms', 'email', 'whatsapp')
 * @param {object} userData - User data to update
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function updateUserAfterVerification(identifier, identifierType, userData) {
  try {
    console.log(`OTP Service - Updating user after verification for ${identifierType}: ${identifier}`);
    
    // Connect to database
    await connectToDatabase();
    
    // Determine the query based on identifier type
    let query = {};
    if (identifierType === 'email') {
      query = { email: identifier };
    } else if (identifierType === 'whatsapp' || identifierType === 'sms' || identifierType === 'phone') {
      query = { mobile: identifier };
    } else {
      throw new Error('Invalid identifier type');
    }
    
    // Find user by identifier
    const user = await User.findOne(query);
    
    if (!user) {
      console.log(`OTP Service - User not found for ${identifierType}: ${identifier}`);
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    console.log(`OTP Service - Found user: ${user._id}, updating with:`, userData);
    
    // Update user information and set contact method
    Object.assign(user, userData, { 
      verified: true,
      contactMethod: identifierType === 'phone' ? 'sms' : identifierType // Convert 'phone' to 'sms'
    });
    
    await user.save();
    
    console.log(`OTP Service - User updated successfully`);
    
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('User update error:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 