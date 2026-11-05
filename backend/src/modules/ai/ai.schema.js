import { z } from "zod";

export const suggestDomainsSchema = z.object({
  body: z.object({
    topic: z.string().trim().min(5).max(500),
  }),
  params: z.object({}),
  query: z.object({}),
});
export const suggestedDomainsResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      domainId: z.string().regex(/^[0-9a-fA-F]{24}$/),
      reason: z.string().trim().min(1).max(300),
    })
  ).min(1).max(5),
});
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const suggestExpertsSchema = z.object({
  body: z.object({
    topic: z.string().trim().min(5).max(500),
    domains: z.array(objectId).max(10).default([]),
  }),
  params: z.object({}),
  query: z.object({}),
});

export const suggestedExpertsResponseSchema = z.object({
  existingExpertIds: z.array(objectId).max(12),

  newExperts: z.array(
    z.object({
      name: z.string().trim().min(2).max(100),
      role: z.string().trim().min(2).max(100),
      description: z.string().trim().max(500),
      expertise: z.array(objectId).min(1).max(10),
      isHumanLike: z.boolean(),
      backstory: z.string().max(2000).optional(),
      speechPattern: z.string().max(1000).optional(),
      characterTraits: z.array(z.string().max(100)).max(15).optional(),
      inspiredBy: z.string().max(100).optional(),
      reason: z.string().trim().min(1).max(300),
    }).superRefine((expert, ctx) => {
      if (!expert.isHumanLike) return;

      if (!expert.backstory?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["backstory"],
          message: "Backstory is required for human-like experts.",
        });
      }

      if (!expert.speechPattern?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["speechPattern"],
          message: "Speech pattern is required for human-like experts.",
        });
      }

      if (!expert.characterTraits?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["characterTraits"],
          message: "Character traits are required for human-like experts.",
        });
      }
    })
  ).max(10),
});