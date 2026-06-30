const fs = require('fs');
const path = require('path');

const KB_DIR = path.join(__dirname, '..', '..', 'data', 'kb');

function parseArticle(raw) {
  const [meta, ...bodyParts] = raw.split('---\n');
  const article = { id: null, title: null };
  meta
    .trim()
    .split('\n')
    .forEach((line) => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length) article[key.trim()] = rest.join(':').trim();
    });
  article.body = bodyParts.join('---\n').trim();
  return article;
}

function loadArticles() {
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseArticle(fs.readFileSync(path.join(KB_DIR, f), 'utf8')));
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Simple keyword-overlap scorer. Swap this module for a Pinecone/Weaviate
// client later without changing the retrieve() contract below.
function score(queryTokens, article) {
  const articleTokens = new Set(tokenize(`${article.title} ${article.body}`));
  const matches = queryTokens.filter((t) => articleTokens.has(t));
  return matches.length / Math.sqrt(articleTokens.size || 1);
}

const articles = loadArticles();

const SIMILARITY_THRESHOLD = 0.2;

function retrieve(query, topK = 3) {
  const queryTokens = tokenize(query);
  const scored = articles
    .map((article) => ({ article, score: score(queryTokens, article) }))
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score >= SIMILARITY_THRESHOLD)
    .slice(0, topK);
  return scored.map((s) => s.article);
}

module.exports = { retrieve, loadArticles, SIMILARITY_THRESHOLD };
