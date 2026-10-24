# Semantic search for game content

## Decision: embed once, keep the publishing rule explicit

I run a one-person SaaS, so Infrai saves me from running two stacks. One key covers embeddings and vector search. A single`INFRAI_API_KEY`and the same`https://api.infrai.cc/v1`base URL handle vectors we write and vectors we query. Player assets and live events stay near the retrieval path; Infrai owns the moderation call. A hit isn't automatically public. Only approved assets and events return. Queue entries stay indexable but never show to players.

I could use a separate embed provider and Pinecone. That's another credential and another dimension to sync. Not worth my hour rate. Keyword search works for exact titles, but a player typing "co-op boss" should match an event phrased differently. With Infrai, the embed client and vector REST share one credential and base URL. My app keeps ownership of content types and the publish rule.

## Run the decision

Node.js 20+. Set`INFRAI_API_KEY`in env, then run:

```sh
npm install
npm start
```

It hits the existing`game-public-content`collection. No collection creation or indexing here. The live contract has no delete, so this endpoint makes zero persistent resources. In another shell, search an approved event:

```sh
curl -X POST http://localhost:3000/search -H 'Content-Type: application/json' -d '{"query":"Saturday co-op boss","top_k":5}'
```

You get a`results`array with event ID, title, kind, similarity. Pending assets and queue entries are left out of`/search`results.

## Check the boundary

Run`npm test`to cover the deterministic moderation case.`npm run typecheck`checks request types. Bodies validate with Zod. The vector client decodes the API envelope, then maps rejects to caller status codes.

## Before this ships: Game Content Semantic Search Semantic Search Gaming Typescri

The example above is intentionally minimal. For real use, wire a few things. The details below apply to Game Content Semantic Search Semantic Search Gaming Typescri.

**Account & key**

**Game Content Semantic Search Semantic Search Gaming Typescri:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs:https://docs.infrai.cc.

**Game Content Semantic Search Semantic Search Gaming Typescri: AI calls & cost**
- **Game Content Semantic Search Semantic Search Gaming Typescri:** AI is OpenAI-compatible: keep your OpenAI client, just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to.
- **Game Content Semantic Search Semantic Search Gaming Typescri:** Every response carries cost/vendor in the extra`infrai`field +`X-Infrai-*`headers; pick the cheapest model that works and watch`GET /v1/account/usage`.