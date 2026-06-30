const OpenAI = require('openai');
const { TOOLS, execute } = require('../tools/functions');

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const OPENAI_TOOLS = TOOLS.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.parameters },
}));

function buildSystemPrompt(channel, kbContext) {
  return `You are a helpful, professional, and concise ecommerce support assistant for channel "${channel}".
- Never discuss competitors, politics, or religion.
- Use emojis sparingly, only in casual greetings, never in troubleshooting.
- Answer using ONLY the knowledge base context below and tool results. If you don't know, say so honestly and offer to escalate.
- For order lookups or product search, use the provided tools rather than guessing.
- If the user asks for a password reset, payment edit, or other sensitive account change, call escalate_to_human.

Knowledge base context:
${kbContext || '(no matching articles found)'}
`;
}

async function chat({ channel, history, userMessage, kbContext }) {
  if (!client) {
    return {
      reply:
        'We are experiencing technical issues. Please leave your email and we will get back to you within 1 hour.',
      escalated: false,
      degraded: true,
    };
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(channel, kbContext) },
    ...history,
    { role: 'user', content: userMessage },
  ];
  let escalated = false;

  for (let i = 0; i < 4; i++) {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      tools: OPENAI_TOOLS,
      messages,
    });

    const choice = response.choices[0].message;

    if (!choice.tool_calls || choice.tool_calls.length === 0) {
      messages.push(choice);
      // strip the system prompt back out before persisting to per-user history
      return { reply: choice.content || '', escalated, history: messages.slice(1) };
    }

    messages.push(choice);

    for (const toolCall of choice.tool_calls) {
      const name = toolCall.function.name;
      if (name === 'escalate_to_human') escalated = true;
      let input = {};
      try {
        input = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        input = {};
      }
      const result = execute(name, input);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: "I'm having trouble completing that request — connecting you with a human agent.",
    escalated: true,
    history: messages.slice(1),
  };
}

module.exports = { chat };
