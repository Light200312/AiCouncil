import Domain from "../domains/domain.model.js";
import Expert from "../experts/expert.model.js";
import { generateResponse } from "../../services/llm.service.js";
import { parseAIJson } from "../../utils/parseAIJson.js";
import {
  suggestedDomainsResponseSchema,suggestedExpertsResponseSchema
} from "./ai.schema.js";
export const suggestDomains = async (req, res, next) => {
  try {
    const { topic } = req.validated.body;

    const domains = await Domain.find().select("_id name description").lean();

    if (!domains.length) {
      return res.status(404).json({
        success: false,
        message: "No domains available.",
      });
    }

    const domainList = domains.map((domain) => ({
      id: domain._id.toString(),
      name: domain.name,
      description: domain.description || "",
    }));

    const response = await generateResponse(
      `Debate topic: "${topic}"

Available domains:
${JSON.stringify(domainList)}

Identify the 3 to 5 most relevant domains for this debate.

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    {
      "domainId": "exact ID from the available domains",
      "reason": "Brief explanation of why this domain is relevant."
    }
  ]
}

Rules:
- Only use domain IDs from the provided list.
- Do not invent domains or IDs.
- Do not repeat a domain.
- Prefer the most relevant domains.
- Return fewer than 3 only if fewer are genuinely relevant.`,
      "You are an expert debate-domain classifier. Analyze topics from multiple perspectives and return structured JSON only.",
    );

    // Remove optional Markdown code fences from the LLM response.
    const cleanedResponse = response
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = suggestedDomainsResponseSchema.parse(
  parseAIJson(cleanedResponse)
);

    const validDomainIds = new Set(
      domains.map((domain) => domain._id.toString()),
    );

    const suggestions = parsed.suggestions
      .filter(
        (item) =>
          validDomainIds.has(item.domainId) && typeof item.reason === "string",
      )
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => entry.domainId === item.domainId) ===
          index,
      )
      .slice(0, 5)
      .map((item) => ({
        ...item,
        domain: domains.find(
          (domain) => domain._id.toString() === item.domainId,
        ),
      }));

    return res.status(200).json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    next(error);
  }
};
export const suggestExperts = async (req, res, next) => {
  try {
    const { topic, domains: selectedDomainIds } = req.validated.body;
    const userId = req.user.userId;

    // Fetch available domains.
    const domains = await Domain.find()
      .select("_id name description")
      .lean();

    const validDomainIds = new Set(
      domains.map((domain) => domain._id.toString())
    );

    if (selectedDomainIds.some((id) => !validDomainIds.has(id))) {
      return res.status(400).json({
        success: false,
        message: "One or more selected domains are invalid.",
      });
    }

    // Fetch built-in experts and the current user's saved experts.
    const filter = {
      isActive: true,
      $or: [{ createdBy: null }, { createdBy: userId }],
    };

    if (selectedDomainIds.length) {
      filter.expertise = { $in: selectedDomainIds };
    }

    const experts = await Expert.find(filter)
      .select(
        "name role description expertise isHumanLike backstory speechPattern characterTraits inspiredBy"
      )
      .populate("expertise", "name")
      .limit(20)
      .lean();

    const availableExperts = experts.map((expert) => ({
      id: expert._id.toString(),
      name: expert.name,
      role: expert.role,
      description: expert.description,
      expertise: expert.expertise.map((domain) => ({
        id: domain._id.toString(),
        name: domain.name,
      })),
      isHumanLike: expert.isHumanLike,
      backstory: expert.backstory,
      speechPattern: expert.speechPattern,
      characterTraits: expert.characterTraits,
      inspiredBy: expert.inspiredBy,
    }));

    const availableDomains = domains.map((domain) => ({
      id: domain._id.toString(),
      name: domain.name,
    }));

    const response = await generateResponse(
      `Debate topic: ${topic}

Selected domains:
${JSON.stringify(selectedDomainIds)}

Available domains:
${JSON.stringify(availableDomains)}

Available experts:
${JSON.stringify(availableExperts)}

Build a suitable council of 2 to 12 experts.

Return ONLY valid JSON in this format:
{
  "existingExpertIds": ["existing expert ID"],
  "newExperts": [
    {
      "name": "Expert name",
      "role": "Expert role",
      "description": "Short description",
      "expertise": ["valid domain ID"],
      "isHumanLike": false,
      "reason": "Why this expert is needed"
    }
  ]
}

Rules:
- Prefer reusing existing experts.
- Select only experts relevant to the debate.
- Do not select the same expert twice.
- Create new experts only when existing experts leave a genuine gap.
- Never invent existing expert IDs.
- New expert expertise must use IDs from Available domains.
- ${selectedDomainIds.length ? "Prefer the selected domains for new experts." : "Choose relevant domains for new experts."}
- If isHumanLike is true, include backstory, speechPattern, and characterTraits.
- Human-like characters inspired by real people must be fictional interpretations, not impersonations.
- Keep the total council size between 2 and 12.
- Do not create unnecessary experts.`,
      "You are an AI council architect. Assemble balanced, relevant expert panels. Return JSON only."
    );

    const cleanedResponse = response
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = suggestedExpertsResponseSchema.parse(
      parseAIJson(cleanedResponse)
    );

    // Only accept existing expert IDs that were actually provided.
    const availableExpertIds = new Set(
      experts.map((expert) => expert._id.toString())
    );

    const existingExpertIds = [
      ...new Set(parsed.existingExpertIds),
    ].filter((id) => availableExpertIds.has(id));

    // Reject proposed experts with invalid domain references.
    const newExperts = parsed.newExperts.filter((expert) =>
      expert.expertise.every((id) => validDomainIds.has(id))
    );

    return res.status(200).json({
      success: true,
      data: {
        existingExpertIds,
        newExperts,
      },
    });
  } catch (error) {
    next(error);
  }
};