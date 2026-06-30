// Lightweight, dependency-free guardrails. Swap detectAnger() for a real
// classifier (e.g. DistilBERT sentiment model) when available.

const HUMAN_REQUEST_PATTERNS = /\b(talk to (a )?human|speak to (a )?agent|real person|customer service rep)\b/i;
const ANGER_PATTERNS = /\b(furious|outraged|terrible|worst|scam|unacceptable|disgusting|sue|lawsuit)\b/i;
const SENSITIVE_ACTION_PATTERNS = /\b(reset my password|change my password|update my card|edit (my )?payment|credit card number)\b/i;

function shouldEscalate(message) {
  if (HUMAN_REQUEST_PATTERNS.test(message)) {
    return { escalate: true, reason: 'User explicitly requested a human agent.' };
  }
  if (ANGER_PATTERNS.test(message)) {
    return { escalate: true, reason: 'Detected strong negative sentiment.' };
  }
  if (SENSITIVE_ACTION_PATTERNS.test(message)) {
    return { escalate: true, reason: 'Request involves sensitive account/payment changes.' };
  }
  return { escalate: false };
}

// Basic PII masking for logs, per the "LLM/logs must never see raw PII" rule.
function maskPII(text) {
  return text
    .replace(/\b\d{13,19}\b/g, '[REDACTED_CARD]')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, (m) => m[0] + '***@***')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');
}

module.exports = { shouldEscalate, maskPII };
