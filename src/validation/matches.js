import { z } from 'zod';

const isoRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const isIsoDateString = (s) => typeof s === 'string' && isoRegex.test(s);

// MATCH_STATUS constant (keys uppercase, values lowercase)
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Query schema for listing matches: optional limit (coerced positive int, max 100)
export const listMatchesQuerySchema = z.object({
  limit: z
    .coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

// Path param schema for matchId: required id as coerced positive integer
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Create match schema
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, 'sport is required'),
    homeTeam: z.string().min(1, 'homeTeam is required'),
    awayTeam: z.string().min(1, 'awayTeam is required'),
    startTime: z.string().refine(isIsoDateString, { message: 'startTime must be a valid ISO date string' }),
    endTime: z.string().refine(isIsoDateString, { message: 'endTime must be a valid ISO date string' }),
    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        // should be caught by the individual refinements, but keep safe guard
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'startTime and endTime must be valid ISO date strings',
        });
      }
      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'endTime must be after startTime',
          path: ['endTime'],
        });
      }
    }
  });

// Update score schema: requires homeScore and awayScore as coerced non-negative integers
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});