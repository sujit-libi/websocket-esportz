import { MATCH_STATUS } from '../validation/matches.js';

/**
 * Determine match status based on start and end times relative to a reference time.
 * @param {(string|number|Date)} startTime - Match start time (timestamp, date string, or Date).
 * @param {(string|number|Date)} endTime - Match end time (timestamp, date string, or Date).
 * @param {Date} [now=new Date()] - Reference time to compare against.
 * @returns {string|null} One of MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE, or MATCH_STATUS.FINISHED; returns `null` if `startTime` or `endTime` cannot be parsed as valid dates.
 */
export function getMatchStatus(startTime, endTime, now = new Date()) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

/**
 * Ensure a match object's status reflects the current time window and update it if needed.
 * @param {Object} match - Match object containing `startTime`, `endTime`, and `status`; `status` will be updated on change.
 * @param {(status: string) => Promise<void>} updateStatus - Function called with the new status when an update is required.
 * @returns {string} The match object's status after any potential update.
 */
export async function syncMatchStatus(match, updateStatus) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }
  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}