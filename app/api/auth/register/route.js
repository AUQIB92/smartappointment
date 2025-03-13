import { NextResponse } from "next/server";
import { generateAndStoreOTP } from "../../../../lib/otpService";

/**
 * API route handler for user registration with SMS OTP
 * POST /api/auth/register
 */
export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    console.log('Register API - Request body:', JSON.stringify(body, null, 2));
    
    const {
      name,
      mobile,
      address,
      contactMethod,
      email, // Optional email field
    } = body;

    // Check if required fields exist
    if (!name || !mobile || !address) {
      console.log('Register API - Missing required fields');
      return NextResponse.json(
        { error: "Name, mobile number, and address are required" },
        { status: 400 }
      );
    }

    // Validate mobile number format (basic validation)
    if (mobile.length < 10) {
      console.log('Register API - Invalid mobile number format');
      return NextResponse.json(
        {
          error: "Invalid mobile number format. Please enter a valid mobile number",
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !email.includes('@')) {
      console.log('Register API - Invalid email format');
      return NextResponse.json(
        {
          error: "Invalid email format. Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    // Generate and store OTP, passing email as additional data if provided
    const additionalData = email ? { email } : {};
    const result = await generateAndStoreOTP(mobile, 'phone', true, additionalData);
    
    if (!result.success) {
      console.error('Register API - OTP generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate OTP' },
        { status: 500 }
      );
    }
    
    const otp = result.otp;
    console.log(`Generated OTP for ${mobile}: ${otp}`);

    // For demo purposes, we'll just return success
    // In a real application, you would send the OTP via SMS here
    
    const response = {
      success: true,
      message: 'OTP sent successfully to your mobile number',
      // DEVELOPMENT ONLY: Include OTP in response (remove in production)
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    };
    
    console.log('Register API - Response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
