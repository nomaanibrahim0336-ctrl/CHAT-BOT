require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const webRoutes = require('./routes/web');
const metaRoutes = require('./routes/meta');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', webRoutes);
app.use('/webhooks', metaRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.redirect('/widget.html'));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Chatbot server listening on http://localhost:${PORT}`);
    console.log(`Web widget demo: http://localhost:${PORT}/widget.html`);
  });
}

module.exports = app;
