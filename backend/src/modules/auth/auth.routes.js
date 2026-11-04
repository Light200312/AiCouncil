
import { Router } from "express";

import {
  register,
  login,
  getMe,
  logout,
} from "./auth.controller.js";

import { protect } from "../../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
} from "./auth.validation.js";

const router = Router();

// Validate request body before reaching controller
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  req.body = result.data;
  next();
};

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", protect, getMe);
router.post("/logout", logout);

export default router;
