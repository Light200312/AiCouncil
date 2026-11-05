import { generateResponse } from "../services/llm.service.js";

try {
  const response = await generateResponse(
    "Explain what an AI council is in one sentence."
  );

  console.log("LLM response:", response);
} catch (error) {
  console.error("LLM test failed:", error.message);
  process.exitCode = 1;
}