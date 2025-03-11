import { NextResponse } from "next/server";
import connectToDatabase from "../../../lib/db";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Setup endpoint to create admin user
export async function GET(req) {
  try {
    // Connect to the database (this will also initialize admin if needed)
    await connectToDatabase();

    // Dynamically import the User model
    const { default: User } = await import("../../../models/User");

    // Check if admin exists
    const admin = await User.findOne({ role: "admin" });

    if (admin) {
      return NextResponse.json({
        success: true,
        message: "Admin user already exists",
        admin: {
          name: admin.name,
          mobile: admin.mobile,
          email: admin.email,
          role: admin.role,
        },
      });
    } else {
      // Create admin if it doesn't exist
      const hashedPassword = await bcrypt.hash("admin123", 10);

      const newAdmin = new User({
        name: "Admin",
        mobile: "9999999999",
        email: "admin@drimranshealthcare.com",
        address: "Admin Office",
        password: hashedPassword,
        role: "admin",
        verified: true,
      });

      await newAdmin.save();

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        admin: {
          name: newAdmin.name,
          mobile: newAdmin.mobile,
          email: newAdmin.email,
          role: newAdmin.role,
        },
      });
    }
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error during setup",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Initialize admin user
async function initializeAdmin() {
  try {
    await connectToDatabase();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return NextResponse.json(
        { message: "Admin already initialized" },
        { status: 200 }
      );
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const newAdmin = new User({
      name: "Admin",
      mobile: "9999999999",
      email: "admin@drimranshealthcare.com",
      address: "Admin Office",
      password: hashedPassword,
      role: "admin",
      verified: true,
    });

    await newAdmin.save();

    return NextResponse.json(
      { message: "Admin initialized successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Initialize admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
