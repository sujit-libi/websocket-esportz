import { Router } from 'express';
import { matchIdParamSchema } from '../validation/matches.js';
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from '../validation/commentary.js';
import { db } from '../db/db.js';
import { commentary as commentaryTable } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
  const paramsParse = matchIdParamSchema.safeParse(req.params);
  if (!paramsParse.success)
    return res.status(400).json({ error: paramsParse.error.errors });

  const queryParse = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParse.success)
    return res.status(400).json({ error: queryParse.error.errors });

  const matchId = paramsParse.data.id;
  let limit = queryParse.data.limit ?? MAX_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);

  try {
    const results = await db
      .select()
      .from(commentaryTable)
      .where(eq(commentaryTable.matchId, matchId))
      .orderBy(desc(commentaryTable.createdAt))
      .limit(limit);

    return res.json({ commentary: results });
  } catch (err) {
    console.error('Failed to fetch commentary:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const paramsParse = matchIdParamSchema.safeParse(req.params);

  if (!paramsParse.success)
    return res.status(400).json({ error: paramsParse.error.errors });

  const bodyParse = createCommentarySchema.safeParse(req.body);

  if (!bodyParse.success)
    return res.status(400).json({ error: bodyParse.error.errors });

  const matchId = paramsParse.data.id;
  const payload = bodyParse.data;

  try {
    const [inserted] = await db
      .insert(commentaryTable)
      .values({
        matchId,
        minute: payload.minutes,
        sequence: payload.sequence,
        period: payload.period,
        eventType: payload.eventType,
        actor: payload.actor,
        team: payload.team,
        message: payload.message,
        metadata: payload.metadata ?? null,
        tags: payload.tags ?? null,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      try {
        res.app.locals.broadcastCommentary(inserted.matchId, inserted);
      } catch (broadcastError) {
        console.warn('WebSocket broadcast failed', broadcastError);
      }
    }

    return res.status(201).json(inserted);
  } catch (err) {
    console.error('Failed to insert commentary:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
