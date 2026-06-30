const store = require('../integrations/mockStore');

// Explicit tool schemas for Claude's function-calling, per the "never let
// the LLM guess JSON structures" rule.
const TOOLS = [
  {
    name: 'get_order_status',
    description: 'Look up the status, tracking, and items of a customer order by order ID.',
    input_schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', description: 'The order ID, e.g. "1001"' },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'search_products',
    description: 'Search the product catalog by free-text query, color, and/or max price.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free text search, e.g. "running shoes"' },
        color: { type: 'string' },
        maxPrice: { type: 'number' },
      },
    },
  },
  {
    name: 'escalate_to_human',
    description: 'Hand off the conversation to a live human support agent.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why escalation is needed' },
      },
      required: ['reason'],
    },
  },
];

function execute(name, input) {
  switch (name) {
    case 'get_order_status':
      return store.getOrderStatus(input.orderId);
    case 'search_products':
      return store.searchProducts(input);
    case 'escalate_to_human':
      return { escalated: true, reason: input.reason };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

module.exports = { TOOLS, execute };
