import axios from "axios";
import { env } from "../config/env.js";

export const generateResponse = async (prompt, system = "") => {
  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

  const { data } = await axios.post(
    env.API_BOX_URL,
    {
      provider: env.API_BOX_PROVIDER,
      prompt: fullPrompt,
    },
    { timeout: 90000 }
  );

  if (!data.response) {
    throw new Error("Empty response from API-box.");
  }

  return data.response.trim();
};