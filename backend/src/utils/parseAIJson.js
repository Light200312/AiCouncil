export const parseAIJson = (content) => {
  const cleaned = content
    .replace(/```(?:json)?/gi, "")
    .trim()
    .replace(/^json\s*/i, "");

  return JSON.parse(cleaned);
};