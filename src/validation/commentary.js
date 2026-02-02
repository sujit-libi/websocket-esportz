import { z } from 'zod';

export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createCommentarySchema = z.object({
  minutes: z.coerce.number().int().min(0),
  sequence: z.coerce.number().int().min(0).optional(),
  period: z.string().min(1).max(50).optional(),
  eventType: z.string().min(1).max(100).optional(),
  actor: z.string().min(1).max(200).optional(),
  team: z.string().min(1).max(200).optional(),
  message: z.string().max(5000).min(1),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});
