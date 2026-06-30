const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TOOLS, execute } = require('../tools/functions');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Gemini's function-calling schema is an OpenAPI subset that wants
// UPPERCASE type names (OBJECT, STRING, ...), unlike our plain JSON Schema.
function toGeminiSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const out = { ...schema };
  if (typeof out.type === 'string') out.type = out.type.toUpperCase();
  if (out.properties) {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([key, value]) => [key, toGeminiSchema(value)])
    );
  }
  if (out.items) out.items = toGeminiSchema(out.items);
  return out;
}

const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: toGeminiSchema(t.parameters),
    })),
  },
];

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
  if (!genAI) {
    return {
      reply:
        'We are experiencing technical issues. Please leave your email and we will get back to you within 1 hour.',
      escalated: false,
      degraded: true,
    };
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    tools: GEMINI_TOOLS,
    systemInstruction: buildSystemPrompt(channel, kbContext),
  });

  const session = model.startChat({ history });
  let escalated = false;
  let result = await session.sendMessage(userMessage);

  for (let i = 0; i < 4; i++) {
    const functionCalls = result.response.functionCalls() || [];

    if (functionCalls.length === 0) {
      return { reply: result.response.text(), escalated, history: await session.getHistory() };
    }

    const functionResponseParts = functionCalls.map((call) => {
      if (call.name === 'escalate_to_human') escalated = true;
      const output = execute(call.name, call.args || {});
      return { functionResponse: { name: call.name, response: { output } } };
    });

    result = await session.sendMessage(functionResponseParts);
  }

  return {
    reply: "I'm having trouble completing that request — connecting you with a human agent.",
    escalated: true,
    history: await session.getHistory(),
  };
}

module.exports = { chat };
