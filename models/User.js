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
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
