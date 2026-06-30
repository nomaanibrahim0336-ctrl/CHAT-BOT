const express = require('express');
const normalize = require('../channels/normalize');
const orchestrator = require('../orchestrator');

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const message = normalize.fromWeb(req.body);
    const result = await orchestrator.handleMessage(message);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: 'We are experiencing technical issues. Please leave your email and we will get back to you within 1 hour.',
      escalated: false,
      degraded: true,
    });
  }
});

module.exports = router;
