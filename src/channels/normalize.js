// Normalizes inbound payloads from any channel into a single shape used
// by the orchestrator: { source, userId, text }

function fromWeb(body) {
  return { source: 'web', userId: body.userId || 'anonymous', text: body.message };
}

function fromMessenger(entry) {
  const messaging = entry.messaging?.[0];
  return {
    source: 'messenger',
    userId: messaging?.sender?.id,
    text: messaging?.message?.text,
  };
}

function fromInstagram(entry) {
  const messaging = entry.messaging?.[0];
  return {
    source: 'instagram',
    userId: messaging?.sender?.id,
    text: messaging?.message?.text,
  };
}

module.exports = { fromWeb, fromMessenger, fromInstagram };
