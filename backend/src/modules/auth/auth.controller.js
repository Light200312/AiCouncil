
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "./auth.service.js";

const COOKIE_NAME = "accessToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// POST /register
export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);

    res.cookie(COOKIE_NAME, result.token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /login
export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    res.cookie(COOKIE_NAME, result.token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /me
export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /logout
export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
