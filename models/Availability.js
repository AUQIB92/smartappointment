import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  available_slots: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        required: true,
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
          isBooked: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Availability =
  mongoose.models.Availability ||
  mongoose.model("Availability", availabilitySchema);
export default Availability;
