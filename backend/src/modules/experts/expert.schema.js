
import { z } from 'zod'

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID')
export const getExpertsSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    domain: objectId.optional(),
    domains: z.string()
      .optional()
      .transform(value => value ? value.split(',') : [])
      .pipe(z.array(objectId).max(10)),

    type: z.enum(['all', 'ai', 'human']).default('all'),
    search: z.string().trim().max(100).optional(),
  }),
})

export const createExpertSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    role: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    expertise: z.array(objectId).min(1).max(10),
    isHumanLike: z.boolean().default(false),

    backstory: z.string().trim().max(2000).optional(),
    speechPattern: z.string().trim().max(1000).optional(),
    characterTraits: z.array(z.string().trim().min(1).max(100)).max(15).optional(),

    inspiredBy: z.string().trim().max(100).optional(),
    systemPrompt: z.string().trim().max(4000).optional(),
  }).superRefine((data, ctx) => {
    if (!data.isHumanLike) return

    if (!data.backstory) {
      ctx.addIssue({
        code: 'custom',
        path: ['backstory'],
        message: 'Backstory is required for human-like characters',
      })
    }

    if (!data.speechPattern) {
      ctx.addIssue({
        code: 'custom',
        path: ['speechPattern'],
        message: 'Speech pattern is required for human-like characters',
      })
    }

    if (!data.characterTraits?.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['characterTraits'],
        message: 'At least one character trait is required',
      })
    }
  }),
  params: z.object({}),
  query: z.object({}),
})
