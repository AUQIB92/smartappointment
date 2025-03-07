import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // Duration in minutes
    required: true,
  },
  price: {
    type: Number, // Price in Indian Rupees (₹)
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
serviceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);
export default Service;
