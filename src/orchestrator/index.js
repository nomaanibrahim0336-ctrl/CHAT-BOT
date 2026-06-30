const kb = require('../rag/knowledgeBase');
const llm = require('../llm/openai');
const history = require('./history');
const { shouldEscalate, maskPII } = require('./guardrails');

async function handleMessage({ source, userId, text }) {
  if (!text || !text.trim()) {
    return { reply: 'Sorry, I didn\'t catch that — could you say that again?', escalated: false };
  }

  console.log(`[${source}:${userId}] ${maskPII(text)}`);

  const guard = shouldEscalate(text);
  if (guard.escalate) {
    return { reply: "I'm connecting you with a member of our team who can help with that.", escalated: true, reason: guard.reason };
  }

  const articles = kb.retrieve(text);
  const kbContext = articles.map((a) => `### ${a.title}\n${a.body}`).join('\n\n');

  const priorTurns = history.get(source, userId);
  const result = await llm.chat({ channel: source, history: priorTurns, userMessage: text, kbContext });

  if (result.history) {
    // store only the new turns beyond what we already had
    const newTurns = result.history.slice(priorTurns.length);
    newTurns.forEach((turn) => history.append(source, userId, turn));
  }

  return { reply: result.reply, escalated: result.escalated, degraded: result.degraded };
}

module.exports = { handleMessage };
