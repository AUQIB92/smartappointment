import mongoose from "mongoose";
import bcrypt from "bcrypt";

// MongoDB connection string from environment variables
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/healthcare";

// Use existing cached connection if available
let cached = global.mongoose || { conn: null, promise: null };

// Update the global mongoose cache
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then((mongoose) => {
        return mongoose;
      });
  }

  cached.conn = await cached.promise;

  // Once connected, initialize the admin user
  await initializeAdmin();

  return cached.conn;
}

// Function to create initial admin user if it doesn't exist
async function initializeAdmin() {
  try {
    // Dynamically import the User model to avoid issues with Next.js
    const { default: User } = await import("../models/User");

    const existingAdmin = await User.findOne({ role: "admin" });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      // Generate a unique clerkId for admin
      const adminClerkId = "admin-" + new mongoose.Types.ObjectId().toString();

      const newAdmin = new User({
        name: "Admin",
        mobile: "9999999999",
        email: "admin@drimranshealthcare.com",
        address: "Admin Office",
        password: hashedPassword,
        role: "admin",
        verified: true,
        clerkId: adminClerkId,
      });

      await newAdmin.save();
      console.log("Initial admin user created:", newAdmin.email);
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin:", error.message);
  }
}

export default connectToDatabase;
