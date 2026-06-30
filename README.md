# Omnichannel Ecommerce Chatbot — MVP Scaffold

A runnable starting point for the omnichannel conversational AI chatbot described in the project spec. This scaffold implements the Web Widget channel end-to-end with a RAG-style FAQ pipeline and tool-calling for order/product lookups, plus stubbed webhook routes for Messenger and Instagram so real credentials can be dropped in later.

## What's implemented

- **Web chat widget** (`public/widget.html`) talking to `POST /api/chat`.
- **Orchestrator** (`src/orchestrator`) that: logs with PII masked, runs guardrail checks (explicit human request, anger keywords, sensitive account actions), retrieves relevant KB articles, and calls Claude.
- **RAG knowledge base** (`src/rag/knowledgeBase.js`) — simple keyword-overlap retrieval over markdown articles in `data/kb/`. Swap this module for Pinecone/Weaviate + real embeddings without touching the orchestrator.
- **Claude integration with tool calling** (`src/llm/claude.js`, `src/tools/functions.js`) — explicit JSON schemas for `get_order_status`, `search_products`, `escalate_to_human` (no free-form JSON guessing).
- **Mocked OMS/Shopify data** (`src/integrations/mockStore.js`) — replace with real Shopify Admin API / OMS calls.
- **Messenger & Instagram webhook stubs** (`src/routes/meta.js`) — verification handshake + message normalization wired up; actual `sendReply` to the Graph API is a no-op stub until `META_PAGE_ACCESS_TOKEN` is set.
- **Degraded-mode fallback** — if `ANTHROPIC_API_KEY` is missing or the LLM call fails, the bot replies with the static fallback message from the spec instead of crashing.

## Not yet implemented (see spec sections 2.2 P1, 6, 7)

- WhatsApp channel, transactional actions (cancel/modify orders), proactive engagement, multilingual auto-detect.
- Real vector DB, sentiment classifier model, analytics dashboard, CRM integration.
- Persistent history (currently in-memory, per-process).

## Setup

```bash
npm install
cp .env.example .env
# add your ANTHROPIC_API_KEY to .env
npm start
```

Open `http://localhost:3000/widget.html` to chat. Without an API key set, the bot runs in degraded mode and returns the static fallback message — this confirms the server and routing work even before you have a key.

## Project layout

```
src/
  server.js              Express app entrypoint
  routes/web.js           POST /api/chat (web widget)
  routes/meta.js           Messenger + Instagram webhook stubs
  channels/normalize.js   Per-channel payload -> {source, userId, text}
  orchestrator/           Guardrails, history, RAG+LLM coordination
  rag/knowledgeBase.js    Article loader + retrieval (replace with vector DB)
  llm/claude.js            Claude chat + tool-calling loop
  tools/functions.js       Tool schemas + dispatcher
  integrations/mockStore.js Mocked order/product data (replace with Shopify/OMS)
data/kb/                  Sample FAQ articles (shipping, returns, payments, warranty)
public/widget.html        Demo web chat widget
```

## Next steps toward the full spec

1. Replace `mockStore.js` with real Shopify Admin API / OMS calls (read-only first, per P0).
2. Replace `knowledgeBase.js` retrieval with a real vector DB (Pinecone/Weaviate) and an embeddings model (Voyage-2 or text-embedding-3-small).
3. Fill in `sendReply` in `routes/meta.js` with real Graph API calls once `META_PAGE_ACCESS_TOKEN` is available, and add WhatsApp via the same pattern.
4. Swap the keyword-based guardrails in `orchestrator/guardrails.js` for a real sentiment classifier.
5. Add persistent storage (Redis/Postgres) for conversation history instead of the in-memory `Map`.
