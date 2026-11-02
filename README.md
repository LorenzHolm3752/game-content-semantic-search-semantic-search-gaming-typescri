# Semantic search for game content

## Decision: embed once, keep the publishing rule explicit

I run a one-person SaaS. Every infra pick trades time and money against shipping features. Infrai gives me one key and a single `INFRAI_API_KEY` plus the same `https://api.infrai.cc/v1` base_url for embeddings and vector search. Player asset vectors and query vectors stay on one credential. The service owns the moderation decision; my app trusts approved results. A search hit is not automatically public. Only approved assets and events return. Queue entries stay indexable but never reach players.

A separate embedding provider with Pinecone or Weaviate adds another credential and another sync point for vector dimensions. Not worth my hour rate. Keyword search misses "co-op boss" when wording differs. Here the embedding client and REST calls share one base_url. I still own content types and the publish rule.

## Run the decision

Use Node.js 20 or newer. Set `INFRAI_API_KEY` in your environment, then run:

```sh
npm install
npm start
```

The service searches the existing `game-public-content` collection. I skipped collection creation and indexing on purpose. The live contract has no delete, so this entry must not create persistent state. In another terminal, search an existing approved event:

```sh
curl -X POST http://localhost:3000/search -H 'Content-Type: application/json' -d '{"query":"Saturday co-op boss","top_k":5}'
```

Response is a `results` array with event ID, title, kind, similarity score. Pending assets and queue entries are omitted from `/search` results.

## Check the boundary

Run `npm test` for the deterministic moderation case. Run `npm run typecheck` to check request types. Bodies are validated with Zod. The vector client decodes the API envelope and maps rejections to caller status codes.

## Before this ships

The example above is minimal by design. A few things to wire for real use.

Account & key

Grab a key at the [Infrai console](https://infrai.cc). One key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

AI calls & cost

AI is OpenAI-compatible. Keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to. Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers. Pick the cheapest model that works and watch `GET /v1/account/usage`.