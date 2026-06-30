// Stub webhook routes for Facebook Messenger and Instagram DMs via the
// Meta Graph API. Wire up META_VERIFY_TOKEN / META_PAGE_ACCESS_TOKEN in .env
// and point your Meta App's webhook at these URLs to go live (Phase 2).
const express = require('express');
const normalize = require('../channels/normalize');
const orchestrator = require('../orchestrator');

const router = express.Router();

function verifyHandler(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

async function sendReply(platform, recipientId, text) {
  if (!process.env.META_PAGE_ACCESS_TOKEN) {
    console.log(`[stub send:${platform}] to=${recipientId} text="${text}"`);
    return;
  }
  // Real send: POST to graph.facebook.com/v19.0/me/messages with the page
  // access token. Left unimplemented until META_PAGE_ACCESS_TOKEN is set.
}

router.get('/messenger/webhook', verifyHandler);
router.get('/instagram/webhook', verifyHandler);

router.post('/messenger/webhook', async (req, res) => {
  res.sendStatus(200); // ack immediately per Meta's requirements
  for (const entry of req.body.entry || []) {
    const message = normalize.fromMessenger(entry);
    if (!message.userId) continue;
    const result = await orchestrator.handleMessage(message);
    await sendReply('messenger', message.userId, result.reply);
  }
});

router.post('/instagram/webhook', async (req, res) => {
  res.sendStatus(200);
  for (const entry of req.body.entry || []) {
    const message = normalize.fromInstagram(entry);
    if (!message.userId) continue;
    const result = await orchestrator.handleMessage(message);
    await sendReply('instagram', message.userId, result.reply);
  }
});

module.exports = router;
