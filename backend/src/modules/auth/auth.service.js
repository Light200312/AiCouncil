//auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "./user.model.js";
import { env } from "../../config/env.js";

const SALT_ROUNDS = 12;

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};

// Register user
export const registerUser = async ({ name, email, password }) => {
  // Hash password before storing it
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    const token = generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        settings: user.settings,
        dailyTokenCap: user.dailyTokenCap,
      },
      token,
    };
  } catch (error) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue || {})[0];

      if (duplicateField === "email") {
        const conflictError = new Error("Email is already registered");
        conflictError.statusCode = 409;
        throw conflictError;
      }
    }

    throw error;
  }
};

// Login user
export const loginUser = async ({ email, password }) => {
  // Explicitly include passwordHash because select:false
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      settings: user.settings,
      dailyTokenCap: user.dailyTokenCap,
    },
    token,
  };
};

// Get current user
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    settings: user.settings,
    dailyTokenCap: user.dailyTokenCap,
  };
};
