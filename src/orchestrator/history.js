// In-memory per-user conversation history (last N turns), keyed by
// "source:userId" so the same person on different channels stays separate.
// Replace with Redis/DB for production multi-instance deployments.

const MAX_TURNS = 10;
const histories = new Map();

function key(source, userId) {
  return `${source}:${userId}`;
}

function get(source, userId) {
  return histories.get(key(source, userId)) || [];
}

function append(source, userId, message) {
  const k = key(source, userId);
  const turns = histories.get(k) || [];
  turns.push(message);
  while (turns.length > MAX_TURNS * 2) turns.shift();
  histories.set(k, turns);
}

module.exports = { get, append };
