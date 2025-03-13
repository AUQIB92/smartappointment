import { NextResponse } from 'next/server';
import { sendWhatsAppOTP } from '../../../../lib/whatsappApi';
import { generateAndStoreOTP } from '../../../../lib/otpService';

/**
 * API route handler for sending OTP via WhatsApp
 * POST /api/auth/whatsapp-otp
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { mobile, userName, isLogin = false, email } = body;

    // Validate required fields
    if (!mobile || !userName) {
      return NextResponse.json(
        { error: 'Mobile number and user name are required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !email.includes('@')) {
      console.log('WhatsApp OTP API - Invalid email format');
      return NextResponse.json(
        {
          error: "Invalid email format. Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    // Generate and store OTP, passing email as additional data if provided
    const additionalData = email ? { email } : {};
    const result = await generateAndStoreOTP(mobile, 'whatsapp', !isLogin, additionalData);
    
    if (!result.success) {
      console.error('WhatsApp OTP API - OTP generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate OTP' },
        { status: 500 }
      );
    }
    
    const otp = result.otp;
    console.log(`Generated OTP for ${mobile}: ${otp}`);
    
    // Send OTP via WhatsApp
    const sendResult = await sendWhatsAppOTP(mobile, userName, otp);

    if (sendResult.success) {
      // Return success response
      return NextResponse.json({ 
        success: true,
        message: 'OTP sent successfully via WhatsApp',
        // DEVELOPMENT ONLY: Include OTP in response (remove in production)
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      });
    } else {
      // Return error response
      return NextResponse.json(
        { error: sendResult.error || 'Failed to send OTP' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('WhatsApp OTP API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 