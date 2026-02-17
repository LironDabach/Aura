import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: false, // Not required for Google OAuth users
  },

  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows multiple null values
  },

  profilePicture: {
    type: String,
    required: false,
  },

  refreshTokens: {
    type: [String],
    default: [],
  },
});

export default mongoose.model("user", userSchema);
