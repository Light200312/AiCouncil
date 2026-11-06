
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID')

const selectedExpert = z.object({
  _id: z.string().min(1),
  isTemporary: z.boolean().optional(),
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  expertise: z.array(
    z.union([
      objectId,
      z.object({ _id: objectId, name: z.string().optional() }),
    ])
  ).optional(),
  isHumanLike: z.boolean().optional(),
  backstory: z.string().max(2000).optional(),
  speechPattern: z.string().max(1000).optional(),
  characterTraits: z.array(z.string()).optional(),
  inspiredBy: z.string().max(100).optional(),
  systemPrompt: z.string().max(4000).optional(),
})

export const createSessionSchema = z.object({
  body: z.object({
    topic: z.string().trim().min(1).max(500),
    domains: z.array(objectId).max(10).default([]),
    experts: z.array(selectedExpert).min(2).max(12),
    mode: z.enum(['manual', 'auto', 'semi_auto']).default('manual'),
    argumentLimit: z.number().int().min(1).max(100).nullable().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
})
