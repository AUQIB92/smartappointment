import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
    required: true,
  },
  date: {
    type: Date,
    default: null,
    sparse: true, // Allow multiple null values
  },
  start_time: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  end_time: {
    type: String, // Format: "HH:MM" in 24-hour format
    required: true,
  },
  duration: {
    type: Number, // Duration in minutes (default: 15)
    default: 15,
  },
  is_available: {
    type: Boolean,
    default: true,
  },
  is_admin_only: {
    type: Boolean,
    default: false,
  },
  booked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  booking_time: {
    type: Date,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at field on save
slotSchema.pre("save", function (next) {
  this.updated_at = Date.now();
  next();
});

// Create a compound index to ensure uniqueness of doctor slots
slotSchema.index({ doctor_id: 1, day: 1, start_time: 1 }, { unique: true });

// Drop the problematic index if it exists (this will be executed when the model is compiled)
if (mongoose.connection.readyState === 1) {
  // If connected to database
  mongoose.connection.db
    .collection("doctorslots")
    .dropIndex("doctor_id_1_date_1")
    .then(() => console.log("Dropped problematic index"))
    .catch((err) => {
      // Ignore if index doesn't exist
      if (err.code !== 27) {
        console.error("Error dropping index:", err);
      }
    });
}

const DoctorSlot =
  mongoose.models.DoctorSlot || mongoose.model("DoctorSlot", slotSchema);
export default DoctorSlot;
