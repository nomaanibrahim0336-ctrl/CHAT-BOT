const Anthropic = require('@anthropic-ai/sdk');
const { TOOLS, execute } = require('../tools/functions');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

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

  const messages = [...history, { role: 'user', content: userMessage }];
  let escalated = false;

  for (let i = 0; i < 4; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(channel, kbContext),
      tools: TOOLS,
      messages,
    });

    const toolUses = response.content.filter((b) => b.type === 'tool_use');

    if (toolUses.length === 0) {
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      return { reply: text, escalated, history: messages.concat({ role: 'assistant', content: response.content }) };
    }

    messages.push({ role: 'assistant', content: response.content });

    const toolResults = toolUses.map((toolUse) => {
      if (toolUse.name === 'escalate_to_human') escalated = true;
      const result = execute(toolUse.name, toolUse.input);
      return {
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      };
    });

    messages.push({ role: 'user', content: toolResults });
  }

  return {
    reply: "I'm having trouble completing that request — connecting you with a human agent.",
    escalated: true,
    history: messages,
  };
}

module.exports = { chat };
