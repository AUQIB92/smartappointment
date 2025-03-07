import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    default: null,
  },
  password: {
    type: String,
    required: false, // Not required for OTP-based login
  },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient",
  },
  otp: {
    code: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // Doctor-specific fields
  specialization: {
    type: String,
    default: null,
  },
  qualifications: {
    type: String,
    default: null,
  },
  // Add clerkId field with a unique identifier for admin
  clerkId: {
    type: String,
    sparse: true, // This allows multiple null values
    unique: true, // Make sure it's unique
    default: function () {
      // Generate a unique ID for admin users to avoid the duplicate key error
      return this.role === "admin"
        ? "admin-" + new mongoose.Types.ObjectId().toString()
        : null;
    },
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
