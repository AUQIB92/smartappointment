import mongoose from "mongoose";

const DoctorAvailabilitySchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    slots: [
      {
        start_time: {
          type: String,
          required: true,
        },
        end_time: {
          type: String,
          required: true,
        },
      },
    ],
    is_available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create a compound index to ensure a doctor can only have one availability record per day
DoctorAvailabilitySchema.index({ doctor_id: 1, day: 1 }, { unique: true });

export default mongoose.models.DoctorAvailability ||
  mongoose.model("DoctorAvailability", DoctorAvailabilitySchema);
