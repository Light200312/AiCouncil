import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    settings: {
      usageProfile: {
        type: String,
        enum: ["low", "medium", "high", "extra"],
        default: "medium",
      },

      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },
    },

    dailyTokenCap: {
      type: Number,
      default: 50000,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;